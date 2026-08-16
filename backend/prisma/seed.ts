import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import {
  PrismaClient,
  Prisma,
} from '@prisma/client'
import bcrypt from 'bcrypt'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

const adapter = new PrismaPg(pool)

const prisma = new PrismaClient({
  adapter,
})

const products = [
  {
    name: 'Piano',
    price: 12000,
  },
  {
    name: 'Guitar',
    price: 4500,
  },
  {
    name: 'Jack',
    price: 350,
  },
  {
    name: 'Microphone',
    price: 1800,
  },
  {
    name: 'Keyboard',
    price: 2500,
  },
  {
    name: 'Mouse',
    price: 800,
  },
  {
    name: 'Bottle',
    price: 250,
  },
  {
    name: 'Cup',
    price: 150,
  },
  {
    name: 'Speaker',
    price: 3200,
  },
  {
    name: 'Headphone',
    price: 2200,
  },
  {
    name: 'Webcam',
    price: 1900,
  },
  {
    name: 'Monitor',
    price: 6500,
  },
  {
    name: 'Cable',
    price: 300,
  },
  {
    name: 'Charger',
    price: 900,
  },
  {
    name: 'Adapter',
    price: 700,
  },
  {
    name: 'Drum',
    price: 5500,
  },
  {
    name: 'Violin',
    price: 4800,
  },
  {
    name: 'Flute',
    price: 1600,
  },
  {
    name: 'Ukulele',
    price: 2200,
  },
  {
    name: 'Tripod',
    price: 1100,
  },
  {
    name: 'Controller',
    price: 1800,
  },
  {
    name: 'Gamepad',
    price: 1500,
  },
  {
    name: 'Tablet',
    price: 8500,
  },
  {
    name: 'Laptop',
    price: 25000,
  },
  {
    name: 'Camera',
    price: 18000,
  },
  {
    name: 'Lens',
    price: 9500,
  },
  {
    name: 'Printer',
    price: 4200,
  },
  {
    name: 'Router',
    price: 1800,
  },
  {
    name: 'USB',
    price: 450,
  },
  {
    name: 'Powerbank',
    price: 1200,
  },
]

const bangkokLocations = [
  {
    lat: 13.7563,
    lng: 100.5018,
  },
  {
    lat: 13.746,
    lng: 100.5348,
  },
  {
    lat: 13.7246,
    lng: 100.5295,
  },
  {
    lat: 13.7378,
    lng: 100.5601,
  },
  {
    lat: 13.785,
    lng: 100.545,
  },
  {
    lat: 13.806,
    lng: 100.523,
  },
  {
    lat: 13.7447,
    lng: 100.489,
  },
  {
    lat: 13.697,
    lng: 100.495,
  },
  {
    lat: 13.765,
    lng: 100.584,
  },
  {
    lat: 13.776,
    lng: 100.65,
  },
]

function randomProductIndexes(
  count: number,
) {
  const indexes = Array.from(
    { length: products.length },
    (_, index) => index,
  )

  for (
    let i = indexes.length - 1;
    i > 0;
    i--
  ) {
    const j = Math.floor(
      Math.random() * (i + 1),
    )

    ;[indexes[i], indexes[j]] = [
      indexes[j],
      indexes[i],
    ]
  }

  return indexes.slice(0, count)
}

async function main() {
  console.log('Starting seed...')

  const password = await bcrypt.hash(
    'test1234',
    10,
  )

  for (let i = 1; i <= 10; i++) {
    const username = `test${i}`

    const location =
      bangkokLocations[i - 1]

    const selectedIndexes =
      randomProductIndexes(3)

    const selectedProducts =
      selectedIndexes.map(
        (index) => products[index],
      )

    const shopName = selectedProducts
      .map((product) => product.name)
      .join('/')

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

            products: {
              create: selectedProducts.map(
                (product) => ({
                  name: product.name,
                  price: new Prisma.Decimal(
                    product.price,
                  ),
                  stock:
                    Math.floor(
                      Math.random() * 91,
                    ) + 10,
                }),
              ),
            },
          },
        },

        wallet: {
          create: {
            balance: new Prisma.Decimal(
              100000,
            ),
          },
        },
      },

      include: {
        shop: {
          include: {
            products: true,
          },
        },
        wallet: true,
      },
    })

    console.log(
      `Created ${user.username} | Shop: ${user.shop?.name}`,
    )

    user.shop?.products.forEach(
      (product) => {
        console.log(
          `  - ${product.name} | ฿${product.price} | stock ${product.stock}`,
        )
      },
    )
  }

  console.log('Seed completed!')
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