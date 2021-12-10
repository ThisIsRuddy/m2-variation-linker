#### Configurable Relationship Mapper
This module provides functionality to link/unlink configurable products with their variations/simple skus. This is necessary as the existing options for linking are very slow and cumbersome. This module utilizes the Magento async bulk APIs to offer the simplest way to link products - a two column csv - how it should be!

##### Instructions
###### Setup environment config
- Copy `.env.sample` to `.env.staging` (or which env you want to use)
- Update the values to match your env by providing the base URI & required API keys

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
