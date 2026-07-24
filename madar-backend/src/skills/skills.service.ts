import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Skill, SkillDocument } from './schemas/skill.schema';
import { CreateSkillDto } from './dto/create-skill.dto';

@Injectable()
export class SkillsService {
  private readonly logger = new Logger(SkillsService.name);

  constructor(
    @InjectModel(Skill.name) private skillModel: Model<SkillDocument>,
  ) {}

  async create(dto: CreateSkillDto): Promise<Skill> {
    const skill = await this.skillModel.create(dto);
    this.logger.log(`Skill created: ${skill.name}`);
    return skill;
  }

  async findAll(query: any = {}): Promise<{ data: Skill[]; total: number; page: number; limit: number }> {
    const page = parseInt(query.page, 10) || 1;
    const limit = Math.min(parseInt(query.limit, 10) || 50, 100);
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (query.category) filter.category = query.category;
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { nameAr: { $regex: query.search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.skillModel
        .find(filter)
        .sort({ popularityScore: -1, name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.skillModel.countDocuments(filter),
    ]);

    return { data: data as Skill[], total, page, limit };
  }

  async findById(id: string): Promise<Skill> {
    const skill = await this.skillModel.findById(new Types.ObjectId(id)).lean();
    if (!skill) {
      throw new NotFoundException('Skill not found');
    }
    return skill as Skill;
  }

  async update(id: string, dto: Partial<CreateSkillDto>): Promise<Skill> {
    const skill = await this.skillModel
      .findByIdAndUpdate(new Types.ObjectId(id), { $set: dto }, { new: true })
      .lean();
    if (!skill) {
      throw new NotFoundException('Skill not found');
    }
    return skill as Skill;
  }

  async remove(id: string): Promise<void> {
    const result = await this.skillModel.deleteOne({ _id: new Types.ObjectId(id) });
    if (result.deletedCount === 0) {
      throw new NotFoundException('Skill not found');
    }
    this.logger.log(`Skill deleted: ${id}`);
  }

  async bulkCreate(skills: CreateSkillDto[]): Promise<Skill[]> {
    const created = await this.skillModel.insertMany(skills);
    this.logger.log(`Bulk created ${created.length} skills`);
    return created as unknown as Skill[];
  }

  async getTrending(limit: number = 10): Promise<Skill[]> {
    return this.skillModel
      .find()
      .sort({ popularityScore: -1 })
      .limit(limit)
      .lean() as Promise<Skill[]>;
  }

  async getByCategory(category: string): Promise<Skill[]> {
    return this.skillModel
      .find({ category })
      .sort({ name: 1 })
      .lean() as Promise<Skill[]>;
  }
}
