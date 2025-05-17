// server/src/scripts/seedData.ts
import mongoose from 'mongoose';
import { Company } from '../models/Company';
import { Employee } from '../models/Employee';
import { Interview } from '../models/Interview';
import { Job } from '../models/Job';

const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect("mongodb://localhost:27017/interviewai");
    console.log('Connected to MongoDB');
    
    // Clear existing data
    await Company.deleteMany({});
    await Employee.deleteMany({});
    await Interview.deleteMany({});
    await Job.deleteMany({});
    
    console.log('Cleared existing data');
    
    // User IDs from the image
    const userIds = {
      samUsman: new mongoose.Types.ObjectId('680803f5aa2a5f81360163c4'),    // Sam Usman
      samamaUsman: new mongoose.Types.ObjectId('68080429aa2a5f81360163c8'), // Samama Usman
      ranaJi: new mongoose.Types.ObjectId('680de7f9f0212bef25c79709')       // Rana Ji
    };
    
    // Create companies
    const companies = await Company.create([
      {
        name: 'Tech Innovators',
        description: 'Leading technology company focused on innovation',
        owner_id: userIds.samUsman
      },
      {
        name: 'Digital Solutions',
        description: 'Digital transformation and software development',
        owner_id: userIds.samamaUsman
      },
      {
        name: 'Future Systems',
        description: 'AI and machine learning solutions provider',
        owner_id: userIds.ranaJi
      }
    ]);
    
    console.log('Created companies');
    
    // Create jobs for each company
    const jobs = await Job.create([
      {
        name: 'Frontend Developer',
        description: 'Develop and maintain user interfaces using React',
        company_id: companies[0]._id
      },
      {
        name: 'Backend Engineer',
        description: 'Build robust APIs and services using Node.js',
        company_id: companies[0]._id
      },
      {
        name: 'Full Stack Developer',
        description: 'Work on both frontend and backend technologies',
        company_id: companies[1]._id
      },
      {
        name: 'Data Scientist',
        description: 'Analyze data and build machine learning models',
        company_id: companies[2]._id
      },
      {
        name: 'DevOps Engineer',
        description: 'Manage infrastructure and deployment pipelines',
        company_id: companies[1]._id
      }
    ]);
    
    console.log('Created jobs');
    
    // Create employees
    await Employee.create([
      {
        company_id: companies[0]._id,
        user_id: userIds.samamaUsman,
        role: 'Developer'
      },
      {
        company_id: companies[1]._id,
        user_id: userIds.samUsman,
        role: 'Manager'
      },
      {
        company_id: companies[2]._id,
        user_id: userIds.ranaJi,
        role: 'CEO'
      }
    ]);
    
    console.log('Created employees');
    
    // Create interviews
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    
    await Interview.create([
      {
        job_id: jobs[0]._id,
        user_id: userIds.samamaUsman,
        time: '10:00 AM',
        date: tomorrow
      },
      {
        job_id: jobs[2]._id,
        user_id: userIds.samUsman,
        time: '2:30 PM',
        date: nextWeek
      },
      {
        job_id: jobs[3]._id,
        user_id: userIds.ranaJi,
        time: '11:45 AM',
        date: tomorrow
      }
    ]);
    
    console.log('Created interviews');
    
    console.log('Database seeded successfully');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('Database connection closed');
  }
};

// Run the seed function
seedDatabase();