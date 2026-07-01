## Configurable Variation Linker/Unlinker

This module provides functionality to link/unlink configurable products with their variations/simple skus.

This is necessary as the existing options for linking are very slow and cumbersome.

Linking uses one synchronous save per parent product (for correctness under concurrency); unlinking uses the Magento
async bulk API. Either way the input is a simple csv - the simplest way to link products, how it should be!

---

### Installation & Basics

- Run `yarn install` to install the required dependencies
- Copy `.env.sample` to a new file where the suffix represents the environment e.g. `.env.staging`
- Update the values to match your environment by providing:
    - `MAGE_URI` - the url of the Magento store e.g https://daylong.local
    - `MAGE_TOKEN` - an API Integration key created in the Magento Admin (see below permissions) e.g.
      1i7263kjbh237i32y423h4u7tyj2b34ks

#### Required Magento API Permissions

![Required Magento API Permissions](https://user-images.githubusercontent.com/1761171/148114088-668f7ecd-5418-4b99-aaba-94f31b8416dd.png)

### Data & Temp Directory

- `./data` - contains csv files for you to update - there are samples for each of the required csv files see below:
    - `data/attributes.csv` - should contain all the attributes you use for variations e.g. size, colour, length, width
    - `data/link.csv` - should contain 2 columns: `parent_sku` & `sku` and is the list of products you want to link as
      variations
    - `data/unlink.csv` - should contain a list of `parent_sku` in order to remove all variations
    - `data/create-attribute-options.csv` - options to create (columns: `attribute_code`, `sort_order`, `label`,
      `front_label`, `value`)
    - `data/update-attribute-options.csv` - options to update (same columns plus `option_id`)
- `./temp` - contains the last request payloads & responses (link report, bulk status) for debugging

---

### Link Options & Variations to Configurable Products

Allows you to link products together using a two column csv file.

- Check `data/attributes.csv` contains all your expected attributes which are used as variations
- Populate `data/link.csv` with the variations you want to link e.g. PARENT-SKU-001,CHILD-SKU-101
- Run the script by executing the `link` script with your chosen environment: e.g. `yarn link:staging`

#### Processing Logic

- Fetches the variation attribute values for all child simple products (chunks of 100)
- Loads metadata for each variation attribute in `attributes.csv` (fetched once, then cached for the run)
- Builds the unique set of option value indexes across the children
- Saves each parent in ONE synchronous request that sets the type to 'configurable', its configurable options and all
  child links together
- Runs up to 5 parents concurrently and writes a per-parent report to `./temp/LinkReport.json`

> The single synchronous save per parent is deliberate: the async bulk queue processes the options and add-child steps
> for a parent concurrently, and both do a read-modify-write of the same product, causing intermittent
> "duplicate variation option" errors. One save per parent removes that race.

---

### Unlink Options & Variations from Configurable Products

Provides the ability to clear all options and variations from configurable products. This will remove ALL options &
variations from each of the configurable products from the `unlink.csv` file.

- Populate `data/unlink.csv` with the parent_skus you want to clear the options & variations from
- Run the script by executing the `unlink` script with your chosen environment: e.g. `yarn unlink:staging`

#### Processing Logic

- Removes all configurable options from each parent (bulk API) - this in-turn unlinks the simple products that were
  linked to the configurable
- Converts each parent's product type back to 'simple' (bulk API)

---

### Add New Variation Attributes to Existing Configurable Products

Sometimes you need to add new variation attributes to existing configurable products. This can be done easily using the
below instructions:

- Follow [Unlink Options & Variations from Configurable Products](#unlink-options--variations-from-configurable-products)
to unlink all existing options from the configurable products
- Set up your new variation attributes in Magento & set the desired values on the simple products
- Update the `data/attributes.csv` file with the `attribute_code`'s of your new attributes that you created in Magento
- Follow [Link Options & Variations to Configurable Products](#link-options--variations-to-configurable-products)
  to add all the variations to the configurable products this will add link all the variation attribute options

---

### Create / Update Attribute Options

Bulk-create or update the selectable options on an attribute (e.g. add new colours or sizes) directly from a csv.

- To create options: populate `data/create-attribute-options.csv` and run `yarn attributes:create:staging`
- To update existing options: populate `data/update-attribute-options.csv` (include the `option_id` of each option to
  change) and run `yarn attributes:update:staging`

Each row is processed independently; a failing row is logged and counted but does not abort the batch.
