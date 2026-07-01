import fs from 'fs';
import { ApolloClient, InMemoryCache, gql, HttpLink } from '@apollo/client';

// 1. Create Apollo Client instance
const client = new ApolloClient({
  link: new HttpLink({
    uri: 'https://devdaylong.hypernode.io/graphql',
    headers: {
      'Content-Type': 'application/json',
    },
  }),
  cache: new InMemoryCache(),
});

// 2. Define the ProductsByCategory query
const PRODUCTS_BY_CATEGORY = gql`
  query ProductsByCategory(
    $pageSize: Int = 24
    $currentPage: Int = 1
    $filters: ProductAttributeFilterInput = {}
    $sort: ProductAttributeSortInput = {}
    $search: String = ""
  ) {
    products(
      pageSize: $pageSize
      currentPage: $currentPage
      filter: $filters
      sort: $sort
      search: $search
    ) {
      items {
        id
        sku
        name
      }
    }
  }
`;

// 3. Categories to process
const categories = [
  {"category_id": 3,"category_name": "Compression"},
  {"category_id": 4,"category_name": "Extra Light <10mmHg"},
  {"category_id": 5,"category_name": "Light 10-18mmHg"},
  {"category_id": 6,"category_name": "Moderate 15-24mmHg"},
  {"category_id": 7,"category_name": "Firm 20-30mmHg"},
  {"category_id": 8,"category_name": "Extra Firm >30mmHg"},
  {"category_id": 9,"category_name": "Category"},
  {"category_id": 10,"category_name": "Below Knee Stockings"},
  {"category_id": 11,"category_name": "Thigh Compression Stockings"},
  {"category_id": 12,"category_name": "Compression Socks"},
  {"category_id": 13,"category_name": "Application Aids"},
  {"category_id": 14,"category_name": "Wound Care"},
  {"category_id": 15,"category_name": "Compression Tights"},
  {"category_id": 16,"category_name": "Maternity Tights"},
  {"category_id": 17,"category_name": "Hosiery Kits & Liners"},
  {"category_id": 18,"category_name": "Compression Wraps"},
  {"category_id": 19,"category_name": "Arm Sleeve & Hand Supports"},
  {"category_id": 20,"category_name": "Accessories"},
  {"category_id": 21,"category_name": "Ankle Supports"},
  {"category_id": 22,"category_name": "Knee Supports"},
  {"category_id": 23,"category_name": "Sports Wear"},
  {"category_id": 24,"category_name": "Shapewear"},
  {"category_id": 25,"category_name": "Bamboo"},
  {"category_id": 26,"category_name": "Flights Socks"},
  {"category_id": 27,"category_name": "Golf Socks"},
  {"category_id": 28,"category_name": "Hiking"},
  {"category_id": 29,"category_name": "Lower Limb"},
  {"category_id": 30,"category_name": "Upper Limb"},
  {"category_id": 31,"category_name": "British Standard"},
  {"category_id": 32,"category_name": "Black Friday Sale"},
  {"category_id": 33,"category_name": "Clearance"},
  {"category_id": 34,"category_name": "Condition"},
  {"category_id": 35,"category_name": "Varicose Veins"},
  {"category_id": 36,"category_name": "Poor Circulation Hosiery"},
  {"category_id": 37,"category_name": "Deep Vein Thrombosis Hosiery"},
  {"category_id": 38,"category_name": "Bestsellers"},
  {"category_id": 40,"category_name": "Spider Thread Veins Hosiery"},
  {"category_id": 41,"category_name": "Tired Aching Legs Hosiery"},
  {"category_id": 42,"category_name": "Osteoarthritis"},
  {"category_id": 43,"category_name": "Lymphoedema"},
  {"category_id": 44,"category_name": "UK Class 1 | 14-17mmHg"},
  {"category_id": 45,"category_name": "UK Class 2 | 18-24mmHg"},
  {"category_id": 46,"category_name": "UK Class 3 | 25-35mmHg"},
  {"category_id": 47,"category_name": "RAL Standard"},
  {"category_id": 48,"category_name": "RAL Class 1 | 18-21mmHg"},
  {"category_id": 49,"category_name": "RAL Class 2 | 23-32mmHg"},
  {"category_id": 50,"category_name": "RAL Class 3 | 34-46mmHg"},
  {"category_id": 51,"category_name": "EU Standard"},
  {"category_id": 52,"category_name": "EU Class 1 | 18-21mmHg"},
  {"category_id": 53,"category_name": "EU Class 2 | 23-32mmHg"},
  {"category_id": 54,"category_name": "EU Class 3 | 34-46mmHg"},
  {"category_id": 55,"category_name": "AFNOR Standard"},
  {"category_id": 56,"category_name": "AFNOR Class 1 | 10-15mmHg"},
  {"category_id": 57,"category_name": "AFNOR Class 2 | 15-20mmHg"},
  {"category_id": 58,"category_name": "AFNOR Class 3 | 20-36mmHg"},
  {"category_id": 59,"category_name": "AFNOR Class 4 | >36mmhg"},
  {"category_id": 60,"category_name": "US Standard"},
  {"category_id": 61,"category_name": "US Class 1 | 15-20mmHg"},
  {"category_id": 62,"category_name": "US Class 2 | 20-30mmHg"},
  {"category_id": 63,"category_name": "US Class 3 | 30-40mmhg"},
  {"category_id": 64,"category_name": "Company"},
  {"category_id": 65,"category_name": "Lohmann & Rauscher"},
  {"category_id": 66,"category_name": "Activa&reg;"},
  {"category_id": 67,"category_name": "ActiGlide"},
  {"category_id": 68,"category_name": "ReadyWrap&reg;"},
  {"category_id": 69,"category_name": "ActiLymph&reg;"},
  {"category_id": 70,"category_name": "Cellona&reg;"},
  {"category_id": 71,"category_name": "Debrisoft&reg;"},
  {"category_id": 72,"category_name": "Essity"},
  {"category_id": 73,"category_name": "JOBST®"},
  {"category_id": 74,"category_name": "JOBST&reg; Bella Lite"},
  {"category_id": 75,"category_name": "JOBST&reg; FarrowWrap&reg;"},
  {"category_id": 76,"category_name": "JOBST&reg; FarrowWrap&reg; Classic"},
  {"category_id": 77,"category_name": "JOBST&reg; Farrow&reg;"},
  {"category_id": 79,"category_name": "JOBST&reg; FarrowWrap&reg; Lite"},
  {"category_id": 80,"category_name": "JOBST&reg; FarrowWrap&reg; Strong"},
  {"category_id": 81,"category_name": "JOBST&reg; FarrowWrap&reg; OTS"},
  {"category_id": 82,"category_name": "JOBST&reg; Opaque"},
  {"category_id": 83,"category_name": "JOBST&reg; UltraSheer"},
  {"category_id": 84,"category_name": "JOBST&reg; Classic"},
  {"category_id": 85,"category_name": "JOBST&reg; Bellavar"},
  {"category_id": 86,"category_name": "JOBST&reg; for Men"},
  {"category_id": 87,"category_name": "JOBST® UlcerCare"},
  {"category_id": 88,"category_name": "JOBST® Maternity"},
  {"category_id": 89,"category_name": "JOBST&reg; FarrowWrap&reg; Soft"},
  {"category_id": 90,"category_name": "JOBST&reg; FarrowWrap&reg; Silver"},
  {"category_id": 91,"category_name": "JOBST&reg; FarrowWrap&reg; 4000"},
  {"category_id": 92,"category_name": "Brand/Range"},
  {"category_id": 95,"category_name": "JOBST&reg; FarrowHybrid"},
  {"category_id": 96,"category_name": "Dressings"},
  {"category_id": 97,"category_name": "Bandages"},
  {"category_id": 98,"category_name": "Skin Protection"},
  {"category_id": 99,"category_name": "Fiber Pads"},
  {"category_id": 100,"category_name": "Wound Garment Systems"},
  {"category_id": 101,"category_name": "Credalast&reg;"},
  {"category_id": 102,"category_name": "Credalast&reg; Comfort"},
  {"category_id": 103,"category_name": "Credalast&reg; Cotton"},
  {"category_id": 104,"category_name": "Credalast&reg; Nylon"},
  {"category_id": 105,"category_name": "Cizeta Medicali"},
  {"category_id": 106,"category_name": "Varisan&reg;"},
  {"category_id": 107,"category_name": "Varisan&reg; Fashion"},
  {"category_id": 108,"category_name": "Varisan&reg; Fashion for Men"},
  {"category_id": 109,"category_name": "Varisan&reg; Top"},
  {"category_id": 110,"category_name": "Varisan&reg; Top Cotton"},
  {"category_id": 111,"category_name": "Varisan&reg; Flat"},
  {"category_id": 112,"category_name": "Varisan&reg; Ethere"},
  {"category_id": 113,"category_name": "Varisan&reg; Soft"},
  {"category_id": 114,"category_name": "Veinalgic&reg;"},
  {"category_id": 115,"category_name": "LipoCare&reg;"},
  {"category_id": 116,"category_name": "3M&trade;"},
  {"category_id": 117,"category_name": "Cavilon&trade;"},
  {"category_id": 118,"category_name": "Coban&trade;"},
  {"category_id": 119,"category_name": "KerraMax&trade;"},
  {"category_id": 120,"category_name": "Tegaderm&trade;"},
  {"category_id": 121,"category_name": "Arion"},
  {"category_id": 122,"category_name": "Sim-Slide&reg;"},
  {"category_id": 123,"category_name": "Magnide&reg;"},
  {"category_id": 124,"category_name": "Easy-Slide"},
  {"category_id": 125,"category_name": "Easy-Off"},
  {"category_id": 126,"category_name": "Convatec"},
  {"category_id": 127,"category_name": "ConvaMax™"},
  {"category_id": 128,"category_name": "AQUACEL&reg;"},
  {"category_id": 129,"category_name": "Moore UK Ltd"},
  {"category_id": 130,"category_name": "EzyAs&trade;"},
  {"category_id": 131,"category_name": "Flen Health"},
  {"category_id": 132,"category_name": "Flaminal&reg;"},
  {"category_id": 133,"category_name": "Flamigel&reg;"},
  {"category_id": 134,"category_name": "Flamigel&reg; RT"},
  {"category_id": 135,"category_name": "Haddenham&reg;"},
  {"category_id": 136,"category_name": "Microfine"},
  {"category_id": 137,"category_name": "easywrap&reg;"},
  {"category_id": 138,"category_name": "HidraMed Solutions"},
  {"category_id": 139,"category_name": "HidraWear"},
  {"category_id": 140,"category_name": "Juzo&reg;"},
  {"category_id": 141,"category_name": "Juzo&reg; ACS Light"},
  {"category_id": 142,"category_name": "Juzo&reg; Dynamic"},
  {"category_id": 143,"category_name": "Juzo&reg; Dynamic Cotton"},
  {"category_id": 144,"category_name": "Juzo&reg; Expert"},
  {"category_id": 145,"category_name": "Juzo&reg; Soft"},
  {"category_id": 146,"category_name": "Juzo&reg; Hostess"},
  {"category_id": 147,"category_name": "Juzo&reg; Move"},
  {"category_id": 148,"category_name": "Juzo&reg; Dual Stretch"},
  {"category_id": 149,"category_name": "Juzo&reg; Classic"},
  {"category_id": 150,"category_name": "Juzo&reg; Soft Rib"},
  {"category_id": 151,"category_name": "Juzo&reg; Ulcer System"},
  {"category_id": 152,"category_name": "Juzo&reg; Easy Fit"},
  {"category_id": 153,"category_name": "Thesis Technology Ltd"},
  {"category_id": 154,"category_name": "LimbO"},
  {"category_id": 155,"category_name": "TN Medical Ltd"},
  {"category_id": 156,"category_name": "SealCuff&reg;"},
  {"category_id": 157,"category_name": "medi UK"},
  {"category_id": 158,"category_name": "duomed® soft"},
  {"category_id": 159,"category_name": "Mediven&reg;"},
  {"category_id": 160,"category_name": "Mediven&reg; Elegance"},
  {"category_id": 161,"category_name": "Mediven&reg; Plus"},
  {"category_id": 162,"category_name": "Mediven&reg; for Men"},
  {"category_id": 163,"category_name": "Juxta"},
  {"category_id": 164,"category_name": "Juxta-Fit"},
  {"category_id": 165,"category_name": "Juxtacures"},
  {"category_id": 166,"category_name": "Juxtalite"},
  {"category_id": 167,"category_name": "Juxta Comfort"},
  {"category_id": 168,"category_name": "medi UK Accessories"},
  {"category_id": 169,"category_name": "Solidea"},
  {"category_id": 170,"category_name": "Naomi"},
  {"category_id": 171,"category_name": "Venere"},
  {"category_id": 172,"category_name": "Silver Wave"},
  {"category_id": 173,"category_name": "Wonder Model"},
  {"category_id": 174,"category_name": "Miss Relax"},
  {"category_id": 175,"category_name": "Marilyn"},
  {"category_id": 176,"category_name": "Catherine"},
  {"category_id": 177,"category_name": "Be You"},
  {"category_id": 178,"category_name": "Arm Care"},
  {"category_id": 181,"category_name": "Magic"},
  {"category_id": 182,"category_name": "Panty"},
  {"category_id": 184,"category_name": "Wonderful Hips"},
  {"category_id": 185,"category_name": "VENOSAN&reg;"},
  {"category_id": 186,"category_name": "VENOSAN&reg; LEGLINE&reg;"},
  {"category_id": 187,"category_name": "VENOSAN&reg; Accessories"},
  {"category_id": 188,"category_name": "Urgo Medical"},
  {"category_id": 189,"category_name": "Altiform&reg;"},
  {"category_id": 190,"category_name": "Altiven&reg;"},
  {"category_id": 191,"category_name": "Altipress&reg;"},
  {"category_id": 192,"category_name": "Sockaid&trade;"},
  {"category_id": 193,"category_name": "Thuasne&reg;"},
  {"category_id": 194,"category_name": "MOBIDERM&reg;"},
  {"category_id": 195,"category_name": "MOBIDERM&reg; Autofit"},
  {"category_id": 196,"category_name": "VENOFLEX Micro"},
  {"category_id": 197,"category_name": "Action Reliever"},
  {"category_id": 198,"category_name": "Smith + Nephew"},
  {"category_id": 199,"category_name": "ProShield&reg;"},
  {"category_id": 200,"category_name": "SupCare"},
  {"category_id": 201,"category_name": "SupCare Bamboo"},
  {"category_id": 202,"category_name": "SupCare Cotton"},
  {"category_id": 203,"category_name": "SupCare Mens"},
  {"category_id": 204,"category_name": "SupCare Nylon"},
  {"category_id": 205,"category_name": "SupCare Sports"},
  {"category_id": 206,"category_name": "SupCare Unisex"},
  {"category_id": 207,"category_name": "SupCare Womens"},
  {"category_id": 208,"category_name": "SIGVARIS&reg;"},
  {"category_id": 209,"category_name": "Essential COMFORTABLE"},
  {"category_id": 210,"category_name": "Essential THERMOREGULATING"},
  {"category_id": 211,"category_name": "Essential SEMITRANSPARENT"},
  {"category_id": 212,"category_name": "SIGVARIS&reg; Essential"},
  {"category_id": 213,"category_name": "Essential COTTON"},
  {"category_id": 214,"category_name": "Essential MICROFIBRE"},
  {"category_id": 215,"category_name": "SIGVARIS&reg; Style"},
  {"category_id": 216,"category_name": "Style SEMITRANSPARENT"},
  {"category_id": 217,"category_name": "Style OPAQUE"},
  {"category_id": 218,"category_name": "Style TRANSPARENT"},
  {"category_id": 219,"category_name": "Style COLOURS"},
  {"category_id": 220,"category_name": "SIGVARIS&reg; ADVANCE"},
  {"category_id": 221,"category_name": "SIGVARIS&reg; Sport"},
  {"category_id": 222,"category_name": "SIGVARIS&reg; TRADITIONAL"},
  {"category_id": 223,"category_name": "SIGVARIS&reg; ULCER X"},
  {"category_id": 224,"category_name": "SIGVARIS&reg; Active"},
  {"category_id": 225,"category_name": "Active MASCULINE"},
  {"category_id": 226,"category_name": "Active WORK WEAR"},
  {"category_id": 227,"category_name": "SIGVARIS&reg; COMPREFLEX"},
  {"category_id": 228,"category_name": "COMPREFLEX Complete"},
  {"category_id": 229,"category_name": "COMPREFLEX Standard"},
  {"category_id": 230,"category_name": "COMPREFLEX Transition"},
  {"category_id": 231,"category_name": "SIGVARIS&reg; COMPREBOOT"},
  {"category_id": 232,"category_name": "SIGVARIS&reg; COOLFLEX"},
  {"category_id": 233,"category_name": "Socks for You"},
  {"category_id": 234,"category_name": "Credalast&reg; Accessories"},
  {"category_id": 235,"category_name": "SupCare Maternity"},
  {"category_id": 237,"category_name": "Adore"},
];

// 4. Function to fetch products by category
async function fetchProductsByCategory(categoryId) {
  try {
    const { data } = await client.query({
      query: PRODUCTS_BY_CATEGORY,
      variables: {
        pageSize: 10000,
        currentPage: 1,
        filters: {
          category_id: {
            eq: String(categoryId)
          }
        },
        sort: {
          name: null
        },
        search: ""
      }
    });

    console.log(`Found ${data.products.items.length} products in category ${categoryId}`);
    return data.products.items;
  } catch (error) {
    console.error(`Error fetching products for category ${categoryId}:`, error);
    return [];
  }
}

// 5. Function to export all products to a single CSV
function exportToCSV(allProducts, filename = 'all_products.csv') {
  const header = 'category_id,category_name,product_id,product_sku,product_name\n';
  const rows = allProducts.map(item =>
    `${item.category_id},"${item.category_name}",${item.product_id},"${item.product_sku}","${item.product_name}"`
  ).join('\n');
  const csv = header + rows;

  fs.writeFileSync(filename, csv);
  console.log(`\nExported ${allProducts.length} total products to ${filename}`);
}

// 6. Main function
async function main() {
  try {
    const allProducts = [];

    // Loop through each category
    for (const category of categories) {
      console.log(`\nFetching products for category ${category.category_id} (${category.category_name})...`);

      const products = await fetchProductsByCategory(category.category_id);

      // Add category info to each product
      const productsWithCategory = products.map(p => ({
        category_id: category.category_id,
        category_name: category.category_name,
        product_id: p.id,
        product_sku: p.sku,
        product_name: p.name
      }));

      allProducts.push(...productsWithCategory);
    }

    // Export all products to a single CSV
    exportToCSV(allProducts, 'all_category_products.csv');

    console.log(`\nComplete! Processed ${categories.length} categories.`);

  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  }
}

// Execute the script
main();
