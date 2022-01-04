## Configurable Variation Linker/Unlinker

This module provides functionality to link/unlink configurable products with their variations/simple skus.

This is necessary as the existing options for linking are very slow and cumbersome.

This module utilizes the Magento async bulk APIs to offer the simplest way to link products - a two column csv - how it
should be!

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
- `./temp` - contains the last bulk API request payloads & bulk status responses for debugging

---

### Link Options & Variations to Configurable Products

Allows you to link products together using a two column csv file.

- Check `data/attributes.csv` contains all your expected attributes which are used as variations
- Populate `data/link.csv` with the variations you want to link e.g. PARENT-SKU-001,CHILD-SKU-101
- Run the script by executing the `link` script with your chosen environment: e.g. `yarn link:staging`

#### Processing Logic

- Ensures all parent products are set up as 'configurable' using bulk API
- Loads all attribute values for the variation attributes found in the `attributes.csv`
- Fetches the variation attribute values for all simple products (chunks of 2000)
- Cross-matches the simple product attribute_values with the variation attribute ids
- Filters the attribute values for uniques and assigns them as options on the configurable product using the bulk API
- Waits for the options to be added completely before proceeding to link the variations to the configurable
- Links the simple products to the configurable after mapping the attribute values and waits for the links to complete

---

### Unlink Options & Variations from Configurable Products

Provides the ability to clear all options and variations from configurable products. This will remove ALL options &
variations from each of the configurable products from the `unlink.csv` file.

- Populate `data/unlink.csv` with the parent_skus you want to clear the options & variations from
- Run the script by executing the `unlink` script with your chosen environment: e.g. `yarn unlink:staging`

#### Processing Logic

- Loops through the parent_sku found in the `unlink.csv' and removes all the existing options - this in-turn removes all
  the simple products that were linked to the configurable

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
