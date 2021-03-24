#### Configurable Relationship Mapper
This script was created to link simple products to configurable parents.

This is an archaic script that has not been touched since 2017 and should be re-written into a bulk import once 2.4 is on the live store.

##### Instructions
###### setVariations
- Check `files/variation-attributes.csv` contains all your expected attributes used for variations
- Populate `files/relationships.csv` with the mappings required e.g. parent_sku + child_sku
- Run the script by executing:
    - `php setVariations.php production`
    - `php setVariations.php staging`
    - `php setVariations.php local`
    
###### removeVariations
- Check `files/variation-attributes.csv` contains all your expected attributes used for variations
- Populate `files/relationships.csv` with the mappings required e.g. parent_sku + child_sku
- Run the script by executing:
    - `php removeVariations.php production`
    - `php removeVariations.php staging`
    - `php removeVariations.php local`
