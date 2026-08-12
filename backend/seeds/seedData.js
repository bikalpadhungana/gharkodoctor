const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const Admin = require('../models/Admin');
const ServiceType = require('../models/ServiceType');

const seedData = async () => {
  try {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
    } catch (authErr) {
      console.warn(`⚠️ Primary MongoDB connection failed (${authErr.message}). Falling back to local mongodb://127.0.0.1:27017/gharkodoctor...`);
      await mongoose.connect('mongodb://127.0.0.1:27017/gharkodoctor');
    }
    console.log('✅ Connected to MongoDB for seeding');

    // Seed admin
    const existingAdmin = await Admin.findOne({ email: process.env.ADMIN_EMAIL || 'admin@gharkodoctor.com' });
    if (!existingAdmin) {
      await Admin.create({
        name: 'GharkoDoctor Admin',
        email: process.env.ADMIN_EMAIL || 'admin@gharkodoctor.com',
        password: process.env.ADMIN_PASSWORD || 'admin123456',
        role: 'admin'
      });
      console.log('✅ Admin account created');
    }

    // Seed super admin
    const existingSuperAdmin = await Admin.findOne({ email: 'superadmin@gharkodoctor.com' });
    if (!existingSuperAdmin) {
      await Admin.create({
        name: 'Super Admin',
        email: 'superadmin@gharkodoctor.com',
        password: process.env.ADMIN_PASSWORD || 'admin123456',
        role: 'superadmin'
      });
      console.log('✅ Super Admin account created (superadmin@gharkodoctor.com / admin123456)');
    }

    // Seed Phase 1 service types
    const serviceTypes = [
      {
        name: 'home_nurse_visit',
        displayName: {
          ne: 'घरमा नर्स भिजिट',
          en: 'Home Nurse Visit'
        },
        description: {
          ne: 'घरमै नर्सको सेवा — ज्वरो जाँच, रक्तचाप, सामान्य स्वास्थ्य परीक्षण',
          en: 'Nurse visit at home — fever check, blood pressure, general health checkup'
        },
        requiredVerificationFields: ['citizenshipId', 'licenseNumber'],
        basePriceRange: { min: 500, max: 1500 },
        categoryGroup: 'medical',
        icon: '👩‍⚕️',
        sortOrder: 1
      },
      {
        name: 'iv_injection',
        displayName: {
          ne: 'IV / सुई लगाउने',
          en: 'IV / Injection'
        },
        description: {
          ne: 'IV ड्रिप, इन्जेक्सन, र सुई लगाउने सेवा',
          en: 'IV drip, injection, and needle administration service'
        },
        requiredVerificationFields: ['citizenshipId', 'licenseNumber'],
        basePriceRange: { min: 300, max: 1000 },
        categoryGroup: 'medical',
        icon: '💉',
        sortOrder: 2
      },
      {
        name: 'wound_dressing',
        displayName: {
          ne: 'घाउ मलमपट्टी',
          en: 'Wound Dressing'
        },
        description: {
          ne: 'घाउ सफा गर्ने, मलमपट्टी, र ड्रेसिंग सेवा',
          en: 'Wound cleaning, bandaging, and dressing service'
        },
        requiredVerificationFields: ['citizenshipId'],
        basePriceRange: { min: 300, max: 800 },
        categoryGroup: 'medical',
        icon: '🩹',
        sortOrder: 3
      },
      {
        name: 'elderly_care_checkin',
        displayName: {
          ne: 'बृद्ध हेरचाह चेक-इन',
          en: 'Elderly Care Check-in'
        },
        description: {
          ne: 'बुढाबुढीको नियमित स्वास्थ्य जाँच र हेरचाह',
          en: 'Regular health monitoring and care for elderly family members'
        },
        requiredVerificationFields: ['citizenshipId'],
        basePriceRange: { min: 800, max: 2000 },
        categoryGroup: 'medical',
        icon: '🧓',
        sortOrder: 4
      },
      {
        name: 'blood_sample_collection',
        displayName: {
          ne: 'रक्त नमूना सङ्कलन',
          en: 'Blood Sample Collection'
        },
        description: {
          ne: 'घरमै रगत नमूना लिने — ल्याब रिपोर्ट डिजिटल र फोनमा',
          en: 'Home blood sample collection — lab report delivered digitally and by phone'
        },
        requiredVerificationFields: ['citizenshipId', 'licenseNumber'],
        basePriceRange: { min: 200, max: 500 },
        categoryGroup: 'medical',
        icon: '🩸',
        sortOrder: 5
      },
      {
        name: 'general_checkup',
        displayName: {
          ne: 'सामान्य स्वास्थ्य जाँच',
          en: 'General Health Checkup'
        },
        description: {
          ne: 'डाक्टरद्वारा सामान्य स्वास्थ्य परीक्षण',
          en: 'General health examination by a doctor'
        },
        requiredVerificationFields: ['citizenshipId', 'licenseNumber'],
        basePriceRange: { min: 1000, max: 3000 },
        categoryGroup: 'medical',
        icon: '🩺',
        sortOrder: 6
      }
    ];

    for (const st of serviceTypes) {
      const existing = await ServiceType.findOne({ name: st.name });
      if (!existing) {
        await ServiceType.create(st);
        console.log(`✅ Service type created: ${st.displayName.en}`);
      } else {
        console.log(`ℹ️  Service type exists: ${st.displayName.en}`);
      }
    }

    console.log('\n🎉 Seeding complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding error:', error);
    process.exit(1);
  }
};

seedData();
