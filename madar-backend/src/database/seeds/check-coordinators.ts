import mongoose from 'mongoose';
import { CollegeCoordinator, CollegeCoordinatorSchema } from '../../universities/college-coordinators/schemas/college-coordinator.schema';
import { User, UserSchema } from '../../users/schemas/user.schema';

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/madar';
  await mongoose.connect(uri);
  const CoordinatorModel = mongoose.model(CollegeCoordinator.name, CollegeCoordinatorSchema);
  const UserModel = mongoose.model(User.name, UserSchema);

  const list = await CoordinatorModel.find().lean();
  console.log('--- College Coordinators ---');
  for (const c of list) {
    const user = await UserModel.findById(c.userId).lean() as any;
    console.log(`ID: ${c._id}, Email: ${user?.email}, Role: ${c.role}, Status: ${c.status}, Invitation: ${c.invitationStatus}`);
    console.log(`Permissions:`, c.permissions);
    console.log(`CollegeId:`, c.collegeId);
    console.log('---------------------------');
  }
}

main().catch(console.error).finally(() => mongoose.disconnect());
