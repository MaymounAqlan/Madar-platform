import mongoose from 'mongoose';
import * as path from 'path';
import { University, UniversitySchema } from '../../universities/schemas/university.schema';
import { Department, DepartmentSchema } from '../../universities/departments/schemas/department.schema';
import { StudyPlan, StudyPlanSchema } from '../../universities/study-plans/schemas/study-plan.schema';
import { Course, CourseSchema } from '../../universities/courses/schemas/course.schema';

async function main() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/madar';
  await mongoose.connect(uri);

  const UniversityModel = (mongoose.models[University.name] || mongoose.model(University.name, UniversitySchema)) as any;
  const DepartmentModel = (mongoose.models[Department.name] || mongoose.model(Department.name, DepartmentSchema)) as any;
  const StudyPlanModel = (mongoose.models[StudyPlan.name] || mongoose.model(StudyPlan.name, StudyPlanSchema)) as any;
  const CourseModel = (mongoose.models[Course.name] || mongoose.model(Course.name, CourseSchema)) as any;

  const universities = await UniversityModel.find({ slug: { $nin: ['mdu', 'mcu', null, undefined, ''] } }).lean();

  console.log(`Found ${universities.length} universities to seed curriculum for...`);

  const genericCourses = [
    { name: 'Introduction to Computer Science', nameAr: 'مقدمة في علوم الحاسب', code: 'CS101', credits: 3 },
    { name: 'Calculus I', nameAr: 'تفاضل وتكامل 1', code: 'MATH101', credits: 3 },
    { name: 'Physics I', nameAr: 'فيزياء 1', code: 'PHYS101', credits: 3 },
    { name: 'Academic English', nameAr: 'لغة إنجليزية أكاديمية', code: 'ENG101', credits: 2 },
    { name: 'Data Structures', nameAr: 'هياكل البيانات', code: 'CS201', credits: 4 },
  ];

  let totalPlans = 0;
  let totalCourses = 0;

  for (const uni of universities) {
    const departments = await DepartmentModel.find({ universityId: uni._id }).lean();
    if (departments.length === 0) continue;

    console.log(`Processing ${uni.nameAr} (${departments.length} departments)...`);

    for (const dept of departments) {
      // Create Study Plan
      const planName = `خطة ${dept.nameAr || dept.name} 2026`;
      
      const plan = await StudyPlanModel.findOneAndUpdate(
        { universityId: uni._id, departmentId: dept._id, version: 1 },
        {
          $setOnInsert: {
            universityId: uni._id,
            collegeId: dept.collegeId,
            departmentId: dept._id,
            name: planName,
            nameAr: planName,
            description: 'خطة دراسية نموذجية تم إنشاؤها للاختبار',
            totalCredits: 130,
            durationYears: 4,
            academicYear: '2026-2027',
            version: 1,
            status: 'active',
            createdBy: uni.userId || uni._id, // fallback if no user
          }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      if (!plan) continue;
      totalPlans++;

      // Create Courses for this plan
      const courseIds = [];
      for (let i = 0; i < genericCourses.length; i++) {
        const c = genericCourses[i];
        const course = await CourseModel.findOneAndUpdate(
          { studyPlanId: plan._id, code: c.code },
          {
            $setOnInsert: {
              universityId: uni._id,
              collegeId: dept.collegeId,
              departmentId: dept._id,
              studyPlanId: plan._id,
              name: c.name,
              nameAr: c.nameAr,
              nameEn: c.name,
              code: c.code,
              credits: c.credits,
              lectureHours: c.credits,
              tutorialHours: 0,
              practicalHours: 0,
              laboratoryHours: 0,
              level: i < 3 ? 1 : 2,
              semester: i % 2 === 0 ? 1 : 2,
              type: 'required',
              status: 'active',
              skills: ['Problem Solving', 'Analysis']
            }
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        courseIds.push(course._id);
        totalCourses++;
      }

      // Update study plan with courses
      await StudyPlanModel.updateOne(
        { _id: plan._id },
        { 
          $set: { courses: courseIds },
          $addToSet: {
            levels: {
              level: 1,
              semesters: [
                { name: 'الفصل الأول', courseIds: courseIds.slice(0, 3) },
                { name: 'الفصل الثاني', courseIds: courseIds.slice(3, 5) }
              ]
            }
          }
        }
      );
    }
  }

  console.log(`Successfully generated ${totalPlans} study plans and ${totalCourses} courses.`);
  await mongoose.disconnect();
}

main().catch(console.error);
