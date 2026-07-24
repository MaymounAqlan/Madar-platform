import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type StudentDocument = Student & Document;

@Schema({ timestamps: true })
export class Student {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({
    type: {
      universityId: { type: Types.ObjectId, ref: 'University' },
      collegeId: { type: Types.ObjectId, ref: 'College' },
      departmentId: { type: Types.ObjectId, ref: 'Department' },
      majorId: { type: Types.ObjectId, ref: 'AcademicProgram' },
      universityName: String,
      collegeName: String,
      departmentName: String,
      majorName: String,
      requiresAcademicUpdate: { type: Boolean, default: false },
      legacy: {
        universityId: String,
        collegeId: String,
        departmentId: String,
        majorId: String,
        universityName: String,
        collegeName: String,
        departmentName: String,
        majorName: String,
        migratedAt: Date,
        reason: String,
      },
      studentId: String,
      enrollmentYear: Number,
      expectedGraduation: Number,
      academicLevel: { type: String, enum: ['freshman', 'sophomore', 'junior', 'senior', 'graduate'] },
      gpa: { type: Number, min: 0, max: 4 },
      academicStanding: { type: String, enum: ['good', 'probation', 'excellent'], default: 'good' },
    },
    required: true,
  })
  academicInfo: {
    universityId: Types.ObjectId;
    collegeId: Types.ObjectId;
    departmentId: Types.ObjectId;
    majorId: Types.ObjectId;
    universityName: string;
    collegeName: string;
    departmentName: string;
    majorName: string;
    requiresAcademicUpdate: boolean;
    legacy?: {
      universityId?: string;
      collegeId?: string;
      departmentId?: string;
      majorId?: string;
      universityName?: string;
      collegeName?: string;
      departmentName?: string;
      majorName?: string;
      migratedAt?: Date;
      reason?: string;
    };
    studentId: string;
    enrollmentYear: number;
    expectedGraduation: number;
    academicLevel: string;
    gpa: number;
    academicStanding: string;
  };

  @Prop({
    type: {
      firstName: String,
      lastName: String,
      dateOfBirth: Date,
      gender: { type: String, enum: ['male', 'female'] },
      phone: String,
      whatsapp: String,
      socialLinks: {
        linkedin: String,
        github: String,
        portfolio: String,
        website: String,
        facebook: String,
        twitter: String,
        instagram: String,
        youtube: String,
        behance: String,
        dribbble: String,
        stackOverflow: String,
        researchGate: String,
        orcid: String,
      },
      address: {
        formattedAddress: String,
        city: String,
        country: String,
        coordinates: {
          lat: Number,
          lng: Number,
        },
      },
      languages: { type: [String], default: [] },
      bio: String,
      avatarUrl: String,
      coverImageUrl: String,
    },
  })
  personalInfo: {
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    gender: string;
    phone: string;
    whatsapp: string;
    socialLinks: {
      linkedin: string;
      github: string;
      portfolio: string;
      website: string;
      facebook: string;
      twitter: string;
      instagram: string;
      youtube: string;
      behance: string;
      dribbble: string;
      stackOverflow: string;
      researchGate: string;
      orcid: string;
    };
    address: {
      formattedAddress: string;
      city: string;
      country: string;
      coordinates: { lat: number; lng: number };
    };
    languages: string[];
    bio: string;
    avatarUrl: string;
    coverImageUrl: string;
  };

  @Prop({
    type: {
      headline: String,
      careerInterests: { type: [String], default: [] },
      preferredLocations: { type: [String], default: [] },
      preferredJobTypes: { type: [String], default: [] },
      expectedSalary: {
        min: Number,
        max: Number,
        currency: { type: String, default: 'SAR' },
      },
      availability: { type: String, default: 'immediate' },
    },
  })
  professionalProfile: {
    headline: string;
    careerInterests: string[];
    preferredLocations: string[];
    preferredJobTypes: string[];
    expectedSalary: {
      min: number;
      max: number;
      currency: string;
    };
    availability: string;
  };

  @Prop({
    type: [
      {
        skillId: { type: Types.ObjectId, ref: 'Skill' },
        name: String,
        category: String,
        proficiency: { type: Number, min: 0, max: 100 },
        source: { type: String, enum: ['self_assessed', 'cv_parsed', 'verified', 'project', 'course'], default: 'self_assessed' },
        verified: { type: Boolean, default: false },
        acquiredAt: Date,
        lastUsed: Date,
      },
    ],
    default: [],
  })
  skills: Array<{
    skillId: Types.ObjectId;
    name: string;
    category: string;
    proficiency: number;
    source: string;
    verified: boolean;
    acquiredAt: Date;
    lastUsed: Date;
  }>;

  @Prop({
    type: {
      fileUrl: String,
      fileName: String,
      fileType: String,
      fileSize: Number,
      contentHash: { type: String, index: true },
      uploadedAt: Date,
      parsedData: {
        rawText: String,
        rawTextHash: String,
        personalInfo: { type: Object, default: {} },
        extractedSkills: { type: [String], default: [] },
        extractedSoftSkills: { type: [String], default: [] },
        extractedTools: { type: [String], default: [] },
        extractedExperience: { type: [String], default: [] },
        extractedEducation: { type: [String], default: [] },
        extractedProjects: { type: [String], default: [] },
        extractedCertifications: { type: [String], default: [] },
        extractedCourses: { type: [String], default: [] },
        extractedLanguages: { type: [String], default: [] },
        extractedVolunteerWork: { type: [String], default: [] },
        extractedAwards: { type: [String], default: [] },
        extractedAchievements: { type: [String], default: [] },
        extractedPublications: { type: [String], default: [] },
        references: { type: [String], default: [] },
        additionalSections: { type: Object, default: {} },
        parsingConfidence: Number,
      },
      aiAnalysis: {
        summary: String,
        strengths: { type: [String], default: [] },
        weaknesses: { type: [String], default: [] },
        suggestedImprovements: { type: [String], default: [] },
        analyzedAt: Date,
      },
    },
  })
  cvData: {
    fileUrl: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    contentHash: string;
    uploadedAt: Date;
    parsedData: {
      rawText: string;
      rawTextHash: string;
      personalInfo: Record<string, any>;
      extractedSkills: string[];
      extractedSoftSkills: string[];
      extractedTools: string[];
      extractedExperience: string[];
      extractedEducation: string[];
      extractedProjects: string[];
      extractedCertifications: string[];
      extractedCourses: string[];
      extractedLanguages: string[];
      extractedVolunteerWork: string[];
      extractedAwards: string[];
      extractedAchievements: string[];
      extractedPublications: string[];
      references: string[];
      additionalSections: Record<string, string[]>;
      parsingConfidence: number;
    };
    aiAnalysis: {
      summary: string;
      strengths: string[];
      weaknesses: string[];
      suggestedImprovements: string[];
      analyzedAt: Date;
    };
  };

  @Prop({
    type: [
      {
        _id: { type: Types.ObjectId, auto: true },
        title: String,
        description: String,
        technologies: { type: [String], default: [] },
        githubUrl: String,
        liveUrl: String,
        images: { type: [String], default: [] },
        startDate: Date,
        endDate: Date,
        isOngoing: { type: Boolean, default: false },
        teamSize: Number,
        role: String,
        impact: String,
        source: { type: String, enum: ['manual', 'cv_parsed'], default: 'manual' },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    default: [],
  })
  projects: Array<{
    _id: Types.ObjectId;
    title: string;
    description: string;
    technologies: string[];
    githubUrl: string;
    liveUrl: string;
    images: string[];
    startDate: Date;
    endDate: Date;
    isOngoing: boolean;
    teamSize: number;
    role: string;
    impact: string;
    source: string;
    createdAt: Date;
  }>;

  @Prop({
    type: [
      {
        name: String,
        issuer: String,
        issueDate: Date,
        expiryDate: Date,
        credentialId: String,
        credentialUrl: String,
        skills: { type: [String], default: [] },
        source: { type: String, enum: ['manual', 'cv_parsed'], default: 'manual' },
      },
    ],
    default: [],
  })
  certifications: Array<{
    name: string;
    issuer: string;
    issueDate: Date;
    expiryDate: Date;
    credentialId: string;
    credentialUrl: string;
    skills: string[];
    source: string;
  }>;

  @Prop({
    type: [
      {
        name: String,
        provider: String,
        completionDate: Date,
        source: { type: String, enum: ['manual', 'cv_parsed'], default: 'manual' },
      },
    ],
    default: [],
  })
  courses: Array<{
    name: string;
    provider: string;
    completionDate: Date;
    source: string;
  }>;

  @Prop({
    type: [
      {
        title: String,
        company: String,
        type: { type: String, enum: ['full_time', 'part_time', 'internship', 'volunteer', 'freelance'] },
        location: String,
        startDate: Date,
        endDate: Date,
        isCurrent: { type: Boolean, default: false },
        description: String,
        achievements: { type: [String], default: [] },
        skillsUsed: { type: [String], default: [] },
        source: { type: String, enum: ['manual', 'cv_parsed'], default: 'manual' },
      },
    ],
    default: [],
  })
  experiences: Array<{
    title: string;
    company: string;
    type: string;
    location: string;
    startDate: Date;
    endDate: Date;
    isCurrent: boolean;
    description: string;
    achievements: string[];
    skillsUsed: string[];
    source: string;
  }>;

  @Prop({
    type: {
      readinessScore: { type: Number, default: 0, min: 0, max: 100 },
      employabilityIndex: { type: Number, default: 0, min: 0, max: 100 },
      skillDiversityScore: { type: Number, default: 0, min: 0, max: 100 },
      experienceScore: { type: Number, default: 0, min: 0, max: 100 },
      projectQualityScore: { type: Number, default: 0, min: 0, max: 100 },
      lastCalculatedAt: Date,
    },
    default: {},
  })
  aiMetrics: {
    readinessScore: number;
    employabilityIndex: number;
    skillDiversityScore: number;
    experienceScore: number;
    projectQualityScore: number;
    lastCalculatedAt: Date;
  };

  @Prop({
    type: {
      skillVector: { type: [Number], default: [] },
      experienceVector: { type: [Number], default: [] },
      interestVector: { type: [Number], default: [] },
      combinedVector: { type: [Number], default: [] },
      lastUpdated: Date,
    },
    default: {},
  })
  embeddings: {
    skillVector: number[];
    experienceVector: number[];
    interestVector: number[];
    combinedVector: number[];
    lastUpdated: Date;
  };

  @Prop({
    type: {
      profileVisibility: { type: String, enum: ['public', 'university', 'private'], default: 'university' },
      showGpa: { type: Boolean, default: true },
      showContact: { type: Boolean, default: false },
      allowCompanySearch: { type: Boolean, default: true },
      allowAnalytics: { type: Boolean, default: true },
    },
    default: {},
  })
  privacySettings: {
    profileVisibility: string;
    showGpa: boolean;
    showContact: boolean;
    allowCompanySearch: boolean;
    allowAnalytics: boolean;
  };

  @Prop({
    type: {
      lastActiveAt: Date,
      totalLogins: { type: Number, default: 0 },
      totalApplications: { type: Number, default: 0 },
      totalProfileViews: { type: Number, default: 0 },
      totalMatchViews: { type: Number, default: 0 },
      notificationOpenRate: { type: Number, default: 0 },
    },
    default: {},
  })
  engagement: {
    lastActiveAt: Date;
    totalLogins: number;
    totalApplications: number;
    totalProfileViews: number;
    totalMatchViews: number;
    notificationOpenRate: number;
  };
}

export const StudentSchema = SchemaFactory.createForClass(Student);
StudentSchema.index({ 'academicInfo.universityId': 1 });
StudentSchema.index({ 'academicInfo.collegeId': 1 });
StudentSchema.index({ 'academicInfo.departmentId': 1 });
StudentSchema.index({ 'academicInfo.majorId': 1 });
StudentSchema.index({ 'academicInfo.gpa': -1 });
StudentSchema.index({ 'skills.skillId': 1 });
StudentSchema.index({ 'aiMetrics.readinessScore': -1 });
