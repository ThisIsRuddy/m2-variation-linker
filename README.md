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

- Check `data/attributes.csv` contains all your expected attributes which are used as variations
- Populate `files/link.csv` with the mappings required e.g. parent_sku + child_sku
- Run the script by executing:
    - `yarn link:live`
    - `yarn link:staging`
    - `yarn link:local`

---

### Unlink Options & Variations from Configurable Products

- Populate `data/unlink.csv` with the parent_skus you want to clear the options + linked skus from
- Run the script by executing:
    - `yarn unlink:live`
    - `yarn unlink:staging`
    - `yarn unlink:local`

---

### Add New Variation Attributes to Existing Configurable Products

Sometimes you need to add new variation attributes to existing configurable products. This can be done easily using the
below instructions:

- Follow
  the [Unlink Options & Variations from Configurable Products](#unlink-options--variations-from-configurable-products) to
  unlink all existing options from the configurable products
- Set up your new variation attributes in Magento & set the desired values on the simple products
- Update the `data/attributes.csv` file with the `attribute_code`'s of your new attributes that you created in Magento
- Follow the [Link Options & Variations to Configurable Products](#link-options---variations-to-configurable-products)
  to add all the variations to the configurable products this will add link all the variation attribute options
