import bcrypt from 'bcryptjs';
import slugify from 'slugify';

// In-Memory fallback store when local MongoDB daemon is not running
class MemoryStore {
  constructor() {
    this.users = [];
    this.categories = [];
    this.courses = [];
    this.modules = [];
    this.lessons = [];
    this.initDefaultData();
  }

  async initDefaultData() {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    // Initial Users
    this.users = [
      {
        _id: '64f001000000000000000001',
        name: 'Dr. Sarah Mitchell',
        email: 'admin@learnhub.com',
        password: hashedPassword,
        role: 'admin',
        bio: 'Platform Administrator & Curriculum Director.',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        _id: '64f001000000000000000002',
        name: 'Prof. Alex Rivera',
        email: 'instructor@learnhub.com',
        password: hashedPassword,
        role: 'instructor',
        bio: 'Senior Software Architect and Full-Stack MERN Instructor.',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        _id: '64f001000000000000000003',
        name: 'Emily Chen',
        email: 'student@learnhub.com',
        password: hashedPassword,
        role: 'student',
        bio: 'Aspiring Full-Stack Developer.',
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    ];

    // Initial Categories
    this.categories = [
      {
        _id: '64f002000000000000000001',
        name: 'Web Development',
        slug: 'web-development',
        description: 'Frontend, backend, fullstack architectures, and modern web application development.',
        icon: 'Code',
        isActive: true,
        createdBy: this.users[0],
        createdAt: new Date().toISOString(),
      },
      {
        _id: '64f002000000000000000002',
        name: 'Artificial Intelligence & ML',
        slug: 'ai-and-ml',
        description: 'Machine learning fundamentals, neural networks, LLM integrations, and predictive modeling.',
        icon: 'BrainCircuit',
        isActive: true,
        createdBy: this.users[0],
        createdAt: new Date().toISOString(),
      },
      {
        _id: '64f002000000000000000003',
        name: 'Cloud Computing & DevOps',
        slug: 'cloud-and-devops',
        description: 'Containerization, CI/CD pipelines, Kubernetes, AWS architecture, and system reliability.',
        icon: 'Server',
        isActive: true,
        createdBy: this.users[0],
        createdAt: new Date().toISOString(),
      },
    ];

    // Initial Course (Draft)
    this.courses = [
      {
        _id: '64f003000000000000000001',
        title: 'Full-Stack MERN Architecture & Engineering',
        slug: 'full-stack-mern-architecture-101',
        shortDescription: 'Master modern production web development with MongoDB, Express, React 18, and Node.js.',
        description: 'Comprehensive hands-on course covering full-stack architecture, REST API design, state management with Zustand, secure authentication, and production optimization.',
        category: this.categories[0],
        instructor: this.users[1],
        thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=60',
        level: 'Intermediate',
        duration: '12 Hours',
        status: 'DRAFT',
        requirements: ['Basic JavaScript (ES6+)', 'HTML & CSS fundamentals'],
        learningOutcomes: [
          'Design scalable RESTful APIs with Express and Node.js',
          'Model relational and hierarchical data with Mongoose',
          'Build responsive React SPAs with Vite & Tailwind CSS',
          'Implement role-based authorization & JWT security',
        ],
        tags: ['MERN', 'React', 'Node.js', 'MongoDB', 'Express'],
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    ];

    // Initial Modules
    this.modules = [
      {
        _id: '64f004000000000000000001',
        course: '64f003000000000000000001',
        title: 'Module 1: Foundations & Architecture Setup',
        description: 'Setting up the environment, project layout, and understanding client-server communication.',
        orderIndex: 1,
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        _id: '64f004000000000000000002',
        course: '64f003000000000000000001',
        title: 'Module 2: Advanced Backend API Design & Mongoose',
        description: 'Data schemas, controllers, relationships, and error handling.',
        orderIndex: 2,
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    ];

    // Initial Lessons
    this.lessons = [
      {
        _id: '64f005000000000000000001',
        module: '64f004000000000000000001',
        course: '64f003000000000000000001',
        title: 'Lesson 1.1: Platform Overview & Architecture Design',
        description: 'Introduction to multi-role architecture, client-server models, and setup.',
        contentType: 'video',
        content: 'Overview of the architectural layers in modern full-stack platforms.',
        videoUrl: 'https://www.youtube.com/watch?v=7CqJlxBYj-M',
        duration: 15,
        orderIndex: 1,
        isFreePreview: true,
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        _id: '64f005000000000000000002',
        module: '64f004000000000000000001',
        course: '64f003000000000000000001',
        title: 'Lesson 1.2: Environment Setup & Tooling Configuration',
        description: 'Configuring Node.js, Vite, Tailwind CSS, and essential dependencies.',
        contentType: 'article',
        content: 'Detailed step-by-step instructions on setting up environment variables, node modules, and scripts.',
        videoUrl: '',
        duration: 20,
        orderIndex: 2,
        isFreePreview: false,
        isActive: true,
        createdAt: new Date().toISOString(),
      },
      {
        _id: '64f005000000000000000003',
        module: '64f004000000000000000002',
        course: '64f003000000000000000001',
        title: 'Lesson 2.1: Designing Hierarchical Curriculum Schemas',
        description: 'Modeling Course -> Module -> Lesson relationships in MongoDB.',
        contentType: 'video',
        videoUrl: 'https://www.youtube.com/watch?v=W6NZfCO5SIk',
        content: 'In-depth explanation of Mongoose references and population strategies.',
        duration: 25,
        orderIndex: 1,
        isFreePreview: false,
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    ];
  }

  // --- Users ---
  findUserByEmail(email) {
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }

  findUserById(id) {
    return this.users.find((u) => u._id.toString() === id.toString());
  }

  createUser(userData) {
    const newUser = {
      _id: '64f001' + Math.random().toString(16).substr(2, 18),
      isActive: true,
      createdAt: new Date().toISOString(),
      ...userData,
    };
    this.users.push(newUser);
    return newUser;
  }

  // --- Categories ---
  getCategories() {
    return this.categories.filter((c) => c.isActive);
  }

  getCategoryById(id) {
    return this.categories.find(
      (c) => c._id.toString() === id.toString() || c.slug === id
    );
  }

  createCategory(data, userId) {
    const user = this.findUserById(userId);
    const newCategory = {
      _id: '64f002' + Math.random().toString(16).substr(2, 18),
      name: data.name,
      slug: slugify(data.name, { lower: true, strict: true }),
      description: data.description || '',
      icon: data.icon || 'Layers',
      isActive: true,
      createdBy: user ? { _id: user._id, name: user.name, email: user.email } : null,
      createdAt: new Date().toISOString(),
    };
    this.categories.push(newCategory);
    return newCategory;
  }

  updateCategory(id, data) {
    const idx = this.categories.findIndex((c) => c._id.toString() === id.toString());
    if (idx === -1) return null;
    if (data.name) {
      this.categories[idx].name = data.name;
      this.categories[idx].slug = slugify(data.name, { lower: true, strict: true });
    }
    if (data.description !== undefined) this.categories[idx].description = data.description;
    if (data.icon !== undefined) this.categories[idx].icon = data.icon;
    if (data.isActive !== undefined) this.categories[idx].isActive = data.isActive;
    return this.categories[idx];
  }

  deleteCategory(id) {
    const idx = this.categories.findIndex((c) => c._id.toString() === id.toString());
    if (idx === -1) return false;
    this.categories.splice(idx, 1);
    return true;
  }

  // --- Courses ---
  getCourses(filter = {}) {
    return this.courses.filter((course) => {
      if (filter.instructor && course.instructor?._id?.toString() !== filter.instructor.toString()) {
        return false;
      }
      if (filter.category && course.category?._id?.toString() !== filter.category.toString()) {
        return false;
      }
      return true;
    });
  }

  getCourseById(id) {
    return this.courses.find(
      (c) => c._id.toString() === id.toString() || c.slug === id
    );
  }

  createCourse(data, userId) {
    const user = this.findUserById(userId);
    const category = this.getCategoryById(data.category);
    const newCourse = {
      _id: '64f003' + Math.random().toString(16).substr(2, 18),
      title: data.title,
      slug: slugify(data.title, { lower: true, strict: true }) + '-' + Math.floor(1000 + Math.random() * 9000),
      shortDescription: data.shortDescription || '',
      description: data.description,
      category: category || { _id: data.category, name: 'General' },
      instructor: user ? { _id: user._id, name: user.name, email: user.email, role: user.role } : null,
      thumbnail: data.thumbnail || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60',
      level: data.level || 'Beginner',
      duration: data.duration || 'Self-paced',
      status: 'DRAFT',
      requirements: data.requirements || [],
      learningOutcomes: data.learningOutcomes || [],
      tags: data.tags || [],
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.courses.unshift(newCourse);
    return newCourse;
  }

  updateCourse(id, data) {
    const idx = this.courses.findIndex((c) => c._id.toString() === id.toString());
    if (idx === -1) return null;
    const course = this.courses[idx];
    if (data.title) course.title = data.title;
    if (data.shortDescription !== undefined) course.shortDescription = data.shortDescription;
    if (data.description !== undefined) course.description = data.description;
    if (data.thumbnail !== undefined) course.thumbnail = data.thumbnail;
    if (data.level !== undefined) course.level = data.level;
    if (data.duration !== undefined) course.duration = data.duration;
    if (data.requirements !== undefined) course.requirements = data.requirements;
    if (data.learningOutcomes !== undefined) course.learningOutcomes = data.learningOutcomes;
    if (data.tags !== undefined) course.tags = data.tags;
    if (data.category) {
      const cat = this.getCategoryById(data.category);
      if (cat) course.category = cat;
    }
    return course;
  }

  deleteCourse(id) {
    const idx = this.courses.findIndex((c) => c._id.toString() === id.toString());
    if (idx === -1) return false;
    // Cascade delete modules & lessons
    const courseId = this.courses[idx]._id.toString();
    this.modules = this.modules.filter((m) => m.course.toString() !== courseId);
    this.lessons = this.lessons.filter((l) => l.course.toString() !== courseId);
    this.courses.splice(idx, 1);
    return true;
  }

  // --- Modules ---
  getModulesByCourse(courseId) {
    return this.modules
      .filter((m) => m.course.toString() === courseId.toString() && m.isActive)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  getModuleById(id) {
    return this.modules.find((m) => m._id.toString() === id.toString());
  }

  createModule(courseId, data) {
    const highest = this.modules
      .filter((m) => m.course.toString() === courseId.toString())
      .sort((a, b) => b.orderIndex - a.orderIndex)[0];
    const orderIndex = data.orderIndex !== undefined ? data.orderIndex : highest ? highest.orderIndex + 1 : 1;

    const newModule = {
      _id: '64f004' + Math.random().toString(16).substr(2, 18),
      course: courseId,
      title: data.title,
      description: data.description || '',
      orderIndex,
      order: orderIndex,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.modules.push(newModule);
    return newModule;
  }

  updateModule(id, data) {
    const idx = this.modules.findIndex((m) => m._id.toString() === id.toString());
    if (idx === -1) return null;
    if (data.title) this.modules[idx].title = data.title;
    if (data.description !== undefined) this.modules[idx].description = data.description;
    if (data.orderIndex !== undefined) this.modules[idx].orderIndex = data.orderIndex;
    if (data.order !== undefined || data.orderIndex !== undefined) this.modules[idx].order = data.order ?? data.orderIndex;
    if (data.isActive !== undefined) this.modules[idx].isActive = data.isActive;
    return this.modules[idx];
  }

  deleteModule(id) {
    const idx = this.modules.findIndex((m) => m._id.toString() === id.toString());
    if (idx === -1) return false;
    const moduleId = this.modules[idx]._id.toString();
    this.lessons = this.lessons.filter((l) => l.module.toString() !== moduleId);
    this.modules.splice(idx, 1);
    return true;
  }

  // --- Lessons ---
  getLessonsByModule(moduleId) {
    return this.lessons
      .filter((l) => l.module.toString() === moduleId.toString() && l.isActive)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  }

  getLessonById(id) {
    return this.lessons.find((l) => l._id.toString() === id.toString());
  }

  createLesson(moduleId, courseId, data) {
    const highest = this.lessons
      .filter((l) => l.module.toString() === moduleId.toString())
      .sort((a, b) => b.orderIndex - a.orderIndex)[0];
    const orderIndex = data.orderIndex !== undefined ? data.orderIndex : highest ? highest.orderIndex + 1 : 1;

    const newLesson = {
      _id: '64f005' + Math.random().toString(16).substr(2, 18),
      module: moduleId,
      course: courseId,
      title: data.title,
      description: data.description || '',
      contentType: data.contentType || 'video',
      type: data.type || ({ video: 'VIDEO', document: 'RESOURCE', article: 'TEXT' }[String(data.contentType || '').toLowerCase()]) || 'TEXT',
      content: data.content || '',
      videoUrl: data.videoUrl || '',
      resourceUrl: data.resourceUrl || '',
      duration: data.duration ? Number(data.duration) : 10,
      orderIndex,
      order: data.order ?? orderIndex,
      isFreePreview: Boolean(data.isPreview ?? data.isFreePreview),
      isPreview: Boolean(data.isPreview ?? data.isFreePreview),
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    this.lessons.push(newLesson);
    return newLesson;
  }

  updateLesson(id, data) {
    const idx = this.lessons.findIndex((l) => l._id.toString() === id.toString());
    if (idx === -1) return null;
    const lesson = this.lessons[idx];
    if (data.title) lesson.title = data.title;
    if (data.description !== undefined) lesson.description = data.description;
    if (data.contentType !== undefined) lesson.contentType = data.contentType;
    if (data.type !== undefined) lesson.type = data.type;
    if (data.content !== undefined) lesson.content = data.content;
    if (data.videoUrl !== undefined) lesson.videoUrl = data.videoUrl;
    if (data.resourceUrl !== undefined) lesson.resourceUrl = data.resourceUrl;
    if (data.duration !== undefined) lesson.duration = Number(data.duration);
    if (data.orderIndex !== undefined) lesson.orderIndex = data.orderIndex;
    if (data.order !== undefined || data.orderIndex !== undefined) lesson.order = data.order ?? data.orderIndex;
    if (data.isPreview !== undefined || data.isFreePreview !== undefined) {
      lesson.isFreePreview = Boolean(data.isPreview ?? data.isFreePreview);
      lesson.isPreview = lesson.isFreePreview;
    }
    if (data.isActive !== undefined) lesson.isActive = data.isActive;
    return lesson;
  }

  deleteLesson(id) {
    const idx = this.lessons.findIndex((l) => l._id.toString() === id.toString());
    if (idx === -1) return false;
    this.lessons.splice(idx, 1);
    return true;
  }
}

export const memoryStore = new MemoryStore();
export default memoryStore;
