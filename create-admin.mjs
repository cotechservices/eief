// create-admin.mjs
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🔄 Création de l\'administrateur...')
  
  const hashedPassword = await bcrypt.hash('admin123', 10)
  
  const admin = await prisma.utilisateur.upsert({
    where: { email: 'admin@eief.com' },
    update: {},
    create: {
      email: 'admin@eief.com',
      password: hashedPassword,
      nom: 'Admin',
      prenom: 'Super',
      role: 'SUPER_ADMIN',
      estActif: true,
    },
  })
  
  console.log('✅ Admin créé avec succès !')
  console.log('📧 Email:', admin.email)
  console.log('🔑 Mot de passe: admin123')
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e.message)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())