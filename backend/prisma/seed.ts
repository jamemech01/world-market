import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient, Prisma } from '@prisma/client'
import bcrypt from 'bcrypt'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// [name, category, price]
const productSeeds: [string, string, number][] = [
  // Musical Instruments
  ['Piano', 'Musical Instruments', 12000],
  ['Guitar', 'Musical Instruments', 4500],
  ['Drum', 'Musical Instruments', 5500],
  ['Violin', 'Musical Instruments', 4800],
  ['Flute', 'Musical Instruments', 1600],
  ['Ukulele', 'Musical Instruments', 2200],
  ['Saxophone', 'Musical Instruments', 15000],
  ['Trumpet', 'Musical Instruments', 8500],
  ['Cello', 'Musical Instruments', 22000],
  ['Harmonica', 'Musical Instruments', 450],
  // Audio
  ['Microphone', 'Audio', 1800],
  ['Speaker', 'Audio', 3200],
  ['Headphone', 'Audio', 2200],
  ['Amplifier', 'Audio', 6500],
  ['Mixer', 'Audio', 4200],
  ['Turntable', 'Audio', 5800],
  ['Subwoofer', 'Audio', 3800],
  ['Soundbar', 'Audio', 2900],
  // Computer
  ['Laptop', 'Computer', 25000],
  ['Monitor', 'Computer', 6500],
  ['Printer', 'Computer', 4200],
  ['Desktop PC', 'Computer', 18000],
  ['Scanner', 'Computer', 3500],
  ['Projector', 'Computer', 9500],
  ['Server', 'Computer', 45000],
  ['Motherboard', 'Computer', 6800],
  // Computer Accessories
  ['Keyboard', 'Computer Accessories', 2500],
  ['Mouse', 'Computer Accessories', 800],
  ['Webcam', 'Computer Accessories', 1900],
  ['USB Drive', 'Computer Accessories', 450],
  ['External Hard Drive', 'Computer Accessories', 2800],
  ['Laptop Stand', 'Computer Accessories', 650],
  ['Cooling Pad', 'Computer Accessories', 750],
  ['Docking Station', 'Computer Accessories', 2200],
  // Electronics
  ['Tablet', 'Electronics', 8500],
  ['Cable', 'Electronics', 300],
  ['Charger', 'Electronics', 900],
  ['Adapter', 'Electronics', 700],
  ['Powerbank', 'Electronics', 1200],
  ['Smartwatch', 'Electronics', 4500],
  ['Drone', 'Electronics', 15000],
  ['Smartphone', 'Electronics', 18000],
  // Photography
  ['Camera', 'Photography', 18000],
  ['Lens', 'Photography', 9500],
  ['Tripod', 'Photography', 1100],
  ['Flash', 'Photography', 2200],
  ['Camera Bag', 'Photography', 1500],
  ['Memory Card', 'Photography', 850],
  // Gaming
  ['Controller', 'Gaming', 1800],
  ['Gamepad', 'Gaming', 1500],
  ['Gaming Chair', 'Gaming', 6500],
  ['Joystick', 'Gaming', 1200],
  ['VR Headset', 'Gaming', 12000],
  ['Gaming Console', 'Gaming', 15000],
  // Home & Living
  ['Bottle', 'Home & Living', 250],
  ['Cup', 'Home & Living', 150],
  ['Lamp', 'Home & Living', 850],
  ['Pillow', 'Home & Living', 350],
  ['Blanket', 'Home & Living', 650],
  ['Vase', 'Home & Living', 450],
  ['Clock', 'Home & Living', 550],
  ['Mirror', 'Home & Living', 1200],
  ['Rug', 'Home & Living', 1800],
  ['Curtain', 'Home & Living', 950],
  // Networking
  ['Router', 'Networking', 1800],
  ['Modem', 'Networking', 1200],
  ['Switch', 'Networking', 1500],
  ['Access Point', 'Networking', 2200],
  // Accessories
  ['Jack', 'Accessories', 350],
  ['Wallet', 'Accessories', 650],
  ['Belt', 'Accessories', 450],
  ['Sunglasses', 'Accessories', 1200],
  ['Watch', 'Accessories', 3500],
  ['Backpack', 'Accessories', 1500],
  // Kitchen
  ['Blender', 'Kitchen', 1500],
  ['Toaster', 'Kitchen', 1200],
  ['Kettle', 'Kitchen', 850],
  ['Microwave', 'Kitchen', 3500],
  ['Coffee Maker', 'Kitchen', 2200],
  ['Frying Pan', 'Kitchen', 650],
  ['Knife Set', 'Kitchen', 950],
  ['Cutting Board', 'Kitchen', 350],
  // Furniture
  ['Chair', 'Furniture', 1500],
  ['Desk', 'Furniture', 3500],
  ['Sofa', 'Furniture', 12000],
  ['Bookshelf', 'Furniture', 2800],
  ['Wardrobe', 'Furniture', 8500],
  ['Bed Frame', 'Furniture', 9500],
  ['Dining Table', 'Furniture', 7500],
  ['Nightstand', 'Furniture', 1800],
  // Sports
  ['Yoga Mat', 'Sports', 450],
  ['Dumbbell', 'Sports', 850],
  ['Bicycle', 'Sports', 6500],
  ['Tennis Racket', 'Sports', 1800],
  ['Basketball', 'Sports', 550],
  ['Football', 'Sports', 450],
  // Tools
  ['Hammer', 'Tools', 350],
  ['Screwdriver', 'Tools', 250],
  ['Drill', 'Tools', 2200],
  ['Wrench Set', 'Tools', 850],
]

// สร้าง image url จากชื่อสินค้า (keyword-matched stock photo, ไม่ต้องหา URL เอง)
const imageUrlFor = (name: string) =>
  `https://loremflickr.com/400/400/${encodeURIComponent(
    name.toLowerCase().split(' ').join(','),
  )}`

const products = productSeeds.map(([name, category, price]) => ({
  name,
  category,
  price,
  imageUrl: imageUrlFor(name),
}))

const shopNames = [
  'Neon Attic', 'Moonlight Supply', 'Pixel Pantry', 'Midnight Market',
  'Urban Orbit', 'Lucky Corner', 'Blue Fox Store', 'Hidden Shelf',
  'Cloud Nine Goods', 'The Odd Basket',
]

const bangkokLocations = [
  { lat: 13.7563, lng: 100.5018 }, // Central Bangkok
  { lat: 13.6685, lng: 100.6340 }, // Bang Na
  { lat: 13.9130, lng: 100.6040 }, // Don Mueang
  { lat: 13.7215, lng: 100.4760 }, // Thon Buri
  { lat: 13.8130, lng: 100.7310 }, // Min Buri
  { lat: 13.7270, lng: 100.7600 }, // Lat Krabang
  { lat: 13.7760, lng: 100.4380 }, // Taling Chan
  { lat: 13.7050, lng: 100.3490 }, // Nong Khaem
  { lat: 13.9200, lng: 100.6800 }, // Sai Mai
  { lat: 13.6450, lng: 100.5350 }, // Phra Pradaeng
]

async function main() {
  console.log('Starting seed...')
  console.log(`Products per shop: ${products.length}`)

  const password = await bcrypt.hash('test1234', 10)

  for (let i = 1; i <= 10; i++) {
    const username = `test${i}`
    const location = bangkokLocations[i - 1]
    const shopName = shopNames[i - 1]

    // 1. สร้าง user + shop (เปล่า) + wallet ก่อน
    const user = await prisma.user.create({
      data: {
        username,
        password,
        canOpenShop: true,
        shop: {
          create: {
            name: shopName,
            lat: location.lat,
            lng: location.lng,
          },
        },
        wallet: {
          create: {
            balance: new Prisma.Decimal(100000),
            transactions: {
              create: {
                type: 'topup',
                amount: new Prisma.Decimal(100000),
              },
            },
          },
        },
      },
      include: { shop: true, wallet: true },
    })

    // 2. bulk insert สินค้า 100 ชิ้น (เร็วกว่า nested create มาก)
    await prisma.product.createMany({
      data: products.map((product) => ({
        name: product.name,
        category: product.category,
        price: new Prisma.Decimal(product.price),
        stock: Math.floor(Math.random() * 91) + 10,
        imageUrl: product.imageUrl,
        shopId: user.shop!.id,
      })),
    })

    console.log(
      `Created ${user.username} | Shop: ${user.shop?.name} | Products: ${products.length} | Wallet: ฿${user.wallet?.balance}`,
    )
  }

  console.log('Seed completed! Total products:', 10 * products.length)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })