<?php

require_once(__DIR__ . '/../helpers/DotEnv.php');

if (!isset($argv[1])) {
    echo 'You must supply a stage to execute. E.g. php src/scripts/setVariations.php live' . PHP_EOL;
    exit(1);
}

$stage = $argv[1];
$envPath = __DIR__ . '/../../.env.' . $stage;
(new DotEnv($envPath))->load();

echo 'Environment loaded: .env.' . $stage . PHP_EOL;

$MAGE_URI = getenv('MAGE_URI');
$MAGE_TOKEN = getenv('MAGE_TOKEN');

$HEADERS = ['Accept: */*', 'Cache-Control: no-cache', 'Content-Type: application/json', 'Authorization: Bearer ' . $MAGE_TOKEN];

$remove = false;

$o_s_t = microtime(true);
$time = @date('H:i:s');
$chunksize = 25;
clearLog();

$variationAttributes = getVariationAttributesFromCSV('files/variation-attributes.csv');
$relationships = getRelationshipsFromCSV('files/relationships.csv');
$globalAttrs = getGlobalAttributeValues();

foreach ($relationships as $configurable => $simples) {
    if ($remove) {
        removeConfigurableVariations($configurable, $simples);
    } else {
        $total = count($simples);
        $chunks = array_chunk($simples, $chunksize, false);
        for ($i = 0; $i < $max = count($chunks); $i++) {
            logMsg("[$time][MainScript] Processing chunk " . ($i + 1) . " of $max, " . ($curr = ($i * $chunksize)) . "-" . (($i + 1) == $max ? $total : ($curr + $chunksize)) . "/$total " . getElapsed($o_s_t) . PHP_EOL);
            $configurableAttrs = getConfigurableAttributeValues($configurable);
            $pendingAttrs = prepareSimpleAttributeValues($chunks[$i], $configurable);
            postConfigurableAttributeValues($configurable, $pendingAttrs);
            postConfigurableVariations($configurable, $chunks[$i]);
        }
    }
}
logMsg("[$time] Script has finished importing configurable variations. " . getElapsed($o_s_t) . PHP_EOL);

function getVariationAttributesFromCSV($path)
{
    $time = @date('H:i:s');
    $results = [];
    $row = 1;
    if (($handle = fopen($path, "r")) !== false) {
        echo $path;
        while (($data = fgetcsv($handle, ",")) !== false) {
            if ($row > 1) $results[] = $data[0];
            $row++;
        }
        fclose($handle);
    }
    logMsg("[$time][getVariationAttributesFromCSV] Parsed variation attributes from csv file." . PHP_EOL);
    return $results;
}

function getRelationshipsFromCSV($path)
{
    $time = @date('H:i:s');
    $results = [];
    $row = 1;
    if (($handle = fopen($path, "r")) !== false) {
        while (($data = fgetcsv($handle, ",")) !== false) {
            if ($row > 1) $results[$data[0]][] = $data[1];
            $row++;
        }
        fclose($handle);
    }
    logMsg("[$time][getRelationshipsFromCSV] Parsed relationships from csv file." . PHP_EOL);
    return $results;
}

function removeConfigurableVariations($configurable, $simples)
{
    $time = @date('H:i:s');
    $s_t = microtime(true);
    $s = 0;
    $f = [];
    logMsg("[$time][removeConfigurableVariations] Removing simple SKUs from configurable: '$configurable'..." . PHP_EOL);
    for ($i = 0; $i < $max = count($simples); $i++) {
        $st = microtime(true);
        $result = callApi('DELETE', "/rest/V1/configurable-products/" . urlencode($configurable) . "/children/" . urlencode($simples[$i]));
        if (isset($result->message)) {
            logMsg("[$time][removeConfigurableVariations][" . ($i + 1) . "/$max] Failed to remove '$simples[$i]' from configurable '$configurable': " . vsprintf(str_replace("%1", "'%s'", $result->message), $result->parameters));
            $f[] = $simples[$i];
        } else {
            $s++;
            logMsg("[$time][removeConfigurableVariations][" . ($i + 1) . "/$max] Removed '$simples[$i]' from the configurable '$configurable'.");
        }
        logMsg(" Completed in:" . getElapsed($st) . PHP_EOL);
    }
    if (count($f) > 0) logMsg("\t Failed to remove the following simple SKUs from configurable '$configurable': " . PHP_EOL . "\t" . implode(", ", $f) . PHP_EOL);
    logMsg("[$time][removeConfigurableVariations] Finished removing '$max' simple SKUs from configurable '$configurable'. [Success: $s || Failed: " . count($f) . "] -" . getElapsed($s_t) . PHP_EOL);
}

function postConfigurableVariations($configurable, $simples)
{
    $time = @date('H:i:s');
    $s_t = microtime(true);
    $s = 0;
    $f = [];
    logMsg("[$time][postConfigurableVariations] Adding simple SKUs to configurable: '$configurable'..." . PHP_EOL);
    for ($i = 0; $i < $max = count($simples); $i++) {
        $st = microtime(true);
        $result = callApi('POST', "/rest/V1/configurable-products/" . urlencode($configurable) . "/child", ['childSku' => $simples[$i]]);
        if (isset($result->message)) {
            logMsg("\t[" . ($i + 1) . "/$max] Failed to add '$simples[$i]' as variation to configurable '$configurable': " . vsprintf(str_replace("%1", "'%s'", $result->message), isset($result->parameters) ? $result->parameters : []) . ".");
            $f[] = $simples[$i];
        } else {
            $s++;
            logMsg("\t[" . ($i + 1) . "/$max] Added '$simples[$i]' as a variation for the configurable '$configurable'.");
        }
        logMsg(getElapsed($st) . PHP_EOL);
    }
    if (count($f) > 0) logMsg("[$time][postConfigurableVariations] Failed to add the following simple SKUs to configurable '$configurable': " . PHP_EOL . "\t" . implode(", ", $f) . PHP_EOL);
    logMsg("[$time][postConfigurableVariations] Finished adding '$max' simple SKUs to configurable '$configurable'. [S:$s||F:" . count($f) . "] -" . getElapsed($s_t) . PHP_EOL);
}

function postConfigurableAttributeValues($configurable, $pendingAttrs)
{
    $time = @date('H:i:s');
    $s_t = microtime(true);
    logMsg("[$time][postConfigurableAttributeValues] Adding variation option values to configurable: '$configurable'..." . PHP_EOL);
    if (count($pendingAttrs) > 0) {
        $i = 0;
        $max = count($pendingAttrs);
        foreach ($pendingAttrs as $attribute) {
            $st = microtime(true);
            logMsg("\t[" . ($i + 1) . "/" . $max . "] Posting attribute value '" . $attribute['option']['label'] . "' to configurable: '" . $configurable . "'...");

            $result = callApi('POST', "/rest/V1/configurable-products/" . urlencode($configurable) . "/options", $attribute);
            if (isset($result->message)) {
                logMsg(" failed. error: " . vsprintf(str_replace("%1", "'%s'", $result->message), $result->parameters) . ". ");
            } else
                logMsg(" success. ");
            logMsg(getElapsed($st) . PHP_EOL);
            $i++;
        }
    } else {
        logMsg("[$time][postConfigurableAttributeValues] No additional OptionValues to assign to configurable: '$configurable'." . PHP_EOL);
    }
    logMsg("[$time][postConfigurableAttributeValues] Finished adding attribute values to configurable." . getElapsed($s_t) . PHP_EOL);
}

function prepareSimpleAttributeValues($simples, $configurable)
{
    $time = @date('H:i:s');
    $s_t = microtime(true);
    $data = [];
    $exist = [];
    global $variationAttributes;
    global $globalAttrs;
    global $configurableAttrs;
    logMsg("[$time][prepareSimpleAttributeValues] Getting variation option values from simple SKUs..." . PHP_EOL);
    for ($i = 0; $i < $max = count($simples); $i++) {
        $st = microtime(true);
        logMsg("\t[" . ($i + 1) . "/" . $max . "] Preparing attribute values for simple: '" . $simples[$i] . "'... ");
        $attributes = callApi('GET', "/rest/V1/products/" . urlencode($simples[$i]) . "?fields=id,custom_attributes[attribute_code,value]");

        if ($attributes) {
            foreach ($attributes->custom_attributes as $attribute) {

                if (in_array($attribute->attribute_code, $variationAttributes)) {

                    if (isset($configurableAttrs[$attribute->attribute_code])) {
                        if (!isset($configurableAttrs[$attribute->attribute_code]['options'][$attribute->value])) {
                            $data[$attribute->attribute_code]['option'] = [
                                'id' => $configurableAttrs[$attribute->attribute_code]['id'],
                                'attribute_id' => $configurableAttrs[$attribute->attribute_code]['attribute_id'],
                                'label' => $configurableAttrs[$attribute->attribute_code]['label'],
                                'product_id' => $configurableAttrs[$attribute->attribute_code]['product_id']
                            ];
                        } else {
                            $exist[$simples[$i]][] = [
                                'attribute_code' => $attribute->attribute_code,
                                'label' => $configurableAttrs[$attribute->attribute_code]['options'][$attribute->value]['label']
                            ];
                            continue;
                        }
                    } else {
                        $data[$attribute->attribute_code]['option'] = [
                            'attribute_id' => $globalAttrs[$attribute->attribute_code]['id'],
                            'label' => $globalAttrs[$attribute->attribute_code]['label']
                        ];
                    }

                    $data[$attribute->attribute_code]['option']['values'][]['value_index'] = $attribute->value;
                    $data[$attribute->attribute_code]['option']['values'] = array_map('unserialize', array_unique(array_map('serialize', $data[$attribute->attribute_code]['option']['values'])));
                }

            }
        } else {
            logMsg("unable to find attribute values.");
        }
        logMsg(getElapsed($st) . PHP_EOL);
    }
    if (count($exist) > 0) {
        logMsg("[$time][prepareSimpleAttributeValues] Following options from simple SKUs are already attached to configurable SKU '" . $configurable . "':" . PHP_EOL);
        foreach ($exist as $key => $options) {
            logMsg("\t[$key] ");
            foreach ($options as $option) {
                logMsg($option['attribute_code'] . ": " . $option['label'] . ", ");
            }
            logMsg(PHP_EOL);
        }
    }
    logMsg("[$time][prepareSimpleAttributeValues] Completed preparing attribute values from '$max' simple SKUs in:" . getElapsed($s_t) . PHP_EOL);
    return $data;
}

function getConfigurableAttributeValues($configurable)
{
    $time = @date('H:i:s');
    $s_t = microtime(true);
    $data = [];
    global $globalAttrs;

    logMsg("[$time][getConfigurableAttributeValues] Fetching attribute values for configurable: '$configurable'...");
    $attributes = callApi('GET', "/rest/V1/configurable-products/" . urlencode($configurable) . "/options/all");

    if ($attributes) {
        foreach ($attributes as $attribute) {
            $data[$globalAttrs[$attribute->attribute_id]['code']] = [
                'id' => $attribute->id,
                'attribute_id' => $attribute->attribute_id,
                'label' => $attribute->label,
                'product_id' => $attribute->product_id
            ];
            foreach ($attribute->values as $value) {
                $data[$globalAttrs[$attribute->attribute_id]['code']]['options'][$value->value_index] = [
                    'id' => $value->value_index,
                    'label' => $globalAttrs[$attribute->attribute_id]['options'][$value->value_index]['label']
                ];
            }
        }
    } else {
        logMsg("unable to find attribute values.");
    }
    logMsg(getElapsed($s_t) . PHP_EOL);
    return $data;
}

function getGlobalAttributeValues()
{
    $time = @date('H:i:s');
    $st = microtime(true);
    $data = [];
    global $variationAttributes;
    logMsg("[$time][getGlobalAttributeValues] Fetching global attributes and values..." . PHP_EOL);

    foreach ($variationAttributes as $attribute) {
        $result = callApi('GET', '/rest/V1/products/attributes/' . urlencode($attribute) . "?fields=attribute_id,attribute_code,options,default_frontend_label");

        logMsg("\tFetching '" . $attribute . "' ...");
        if($result) {
            logMsg(" Success." . PHP_EOL);
            $data[$result->attribute_id] = [
                'id' => $result->attribute_id,
                'code' => $result->attribute_code,
                'label' => $result->default_frontend_label
            ];
            $data[$result->attribute_code] = [
                'id' => $result->attribute_id,
                'code' => $result->attribute_code,
                'label' => $result->default_frontend_label
            ];
            foreach ($result->options as $option) {
                $data[$result->attribute_id]['options'][$option->value] = [
                    'id' => $option->value,
                    'label' => $option->label
                ];
                $data[$result->attribute_code]['options'][$option->value] = [
                    'id' => $option->value,
                    'label' => $option->label
                ];
            }
        }else{
            logMsg(" Failed." . PHP_EOL);
        }
    }
    logMsg(getElapsed($st) . PHP_EOL);

    if(!$data)
        throw new Error("Unable to retrieve Global attribute values for specified variation attributes.");

    return $data;
}

function getElapsed($s_t)
{
    return " [" . round((microtime(true) - $s_t), 2) . "s]";
}

function callApi($type, $url, $body = [])
{
    global $MAGE_URI;
    $t_curl = getCurl($type, $MAGE_URI . $url, $body);
    $result = json_decode(curl_exec($t_curl));
    curl_close($t_curl);
    return $result;
}

function getCurl($type, $url, $body)
{
    global $HEADERS;
    $curl = curl_init();
    curl_setopt($curl, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($curl, CURLOPT_HTTPHEADER, $HEADERS);
    curl_setopt($curl, CURLOPT_SSL_VERIFYHOST, 0);
    curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, 0);
    curl_setopt($curl, CURLOPT_URL, $url);
    switch ($type) {
        case 'DELETE':
            curl_setopt($curl, CURLOPT_CUSTOMREQUEST, "DELETE");
            break;
        case 'POST':
            curl_setopt($curl, CURLOPT_POST, 1);
            curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($body));
            break;
        default:
            break;
    }
    return $curl;
}

function logMsg($msg)
{
    file_put_contents("logs/" . basename(__FILE__, '.php') . ".log", $msg, FILE_APPEND);
    echo $msg;
}

function clearLog()
{
    file_put_contents("logs/" . basename(__FILE__, '.php') . ".log", '');
}
