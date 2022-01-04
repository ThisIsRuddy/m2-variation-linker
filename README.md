#### Configurable Relationship Mapper
This module provides functionality to link/unlink configurable products with their variations/simple skus. This is necessary as the existing options for linking are very slow and cumbersome. This module utilizes the Magento async bulk APIs to offer the simplest way to link products - a two column csv - how it should be!

##### Instructions
- Run 'yarn install' to install the required dependencies

###### Setup environment config
- Copy `.env.sample` to `.env.staging` (or which env you want to use)
- Update the values to match your env by providing the base URI & required API keys

##### Data & Temp Directory
- `./data` - contains csv files for you to update, there are samples for each
  - `data/attributes.csv` - should contain all the attributes you use for variations e.g. size, colour, length, width
  - `data/link.csv` - should contain 2 columns: `parent_sku` & `sku` and is the list of products you want to link as variations
  - `data/unlink.csv` - should contain a list of `parent_sku` in order to remove all variations
- `./temp` - contains the last bulk API request payloads & bulk status responses for debugging

###### Linking options + products
- Check `data/attributes.csv` contains all your expected attributes which are used as variations
- Populate `files/link.csv` with the mappings required e.g. parent_sku + child_sku
- Run the script by executing:
    - `yarn link:live`
    - `yarn link:staging`
    - `yarn link:local`

###### Unlinking options + products
- Populate `data/unlink.csv` with the parent_skus you want to clear the options + linked skus from
- Run the script by executing:
  - `yarn unlink:live`
  - `yarn unlink:staging`
  - `yarn unlink:local`
