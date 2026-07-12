import { GraduationCap, BookOpen, ClipboardCheck, Calendar, Award, Clock, FileText, CheckCircle } from 'lucide-react';

type Course = {
  title: string;
  duration: string;
  description: string;
};

const COURSES: Course[] = [
  {
    title: 'Bachelor of Theology (B.Th)',
    duration: '3 Years',
    description:
      'A comprehensive undergraduate program covering biblical studies, theology, church history, and practical ministry. Designed for those entering full-time Christian service.',
  },
  {
    title: 'Master of Divinity (M.Div)',
    duration: '3 Years',
    description:
      'An advanced graduate program providing in-depth theological training, biblical languages, and ministry leadership preparation for pastors and church leaders.',
  },
  {
    title: 'Diploma in Theology (Dip.Th)',
    duration: '2 Years',
    description:
      'A foundational theological program covering core biblical doctrines, ministry skills, and spiritual formation for those beginning their ministry journey.',
  },
  {
    title: 'Certificate in Biblical Studies',
    duration: '1 Year',
    description:
      'An introductory program focused on Bible survey, basic theology, and Christian living, ideal for lay leaders and those seeking personal spiritual growth.',
  },
];

const CURRICULUM = [
  'Biblical Studies (Old & New Testament)',
  'Systematic Theology',
  'Church History',
  'Practical Ministry & Homiletics',
  'Biblical Languages (Greek & Hebrew)',
  'Pastoral Care & Counseling',
  'Missions & Evangelism',
  'Christian Education',
  'Worship & Liturgy',
  'Research Methods & Thesis Writing',
];

const REQUIREMENTS = [
  'Completed application form with all required fields',
  'Personal statement of faith and calling',
  'Recommendation letter from pastor or church leader',
  'Academic transcripts from previous education',
  'Passport-size photograph',
  'Proof of date of birth',
  'Interview with the admissions committee',
];

const CALENDAR = [
  { term: 'Admissions Open', period: 'January – March', icon: ClipboardCheck },
  { term: 'Academic Year Begins', period: 'June / July', icon: BookOpen },
  { term: 'First Semester Examinations', period: 'October', icon: FileText },
  { term: 'Winter Break', period: 'December – January', icon: Clock },
  { term: 'Second Semester', period: 'January – April', icon: BookOpen },
  { term: 'Final Examinations & Graduation', period: 'April – May', icon: Award },
];

export default function AcademicInfo() {
  return (
    <div className="min-h-screen bg-navy-50 dark:bg-navy-950">
      <section className="bg-navy-800 dark:bg-navy-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <GraduationCap className="w-12 h-12 text-gold-400 mx-auto mb-4" />
          <h1 className="text-4xl sm:text-5xl font-serif font-bold mb-4">Academic Information</h1>
          <p className="text-navy-100 dark:text-navy-300 text-lg">
            Courses, curriculum, admissions, and the academic calendar
          </p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12 space-y-16">
        <section>
          <div className="flex items-center gap-3 mb-8">
            <BookOpen className="w-7 h-7 text-gold-600 dark:text-gold-400" />
            <h2 className="text-3xl font-serif font-bold text-navy-900 dark:text-navy-50">
              Courses Offered
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {COURSES.map((course) => (
              <article
                key={course.title}
                className="bg-white dark:bg-navy-900 rounded-2xl shadow-md border border-navy-100 dark:border-navy-800 p-6 hover:shadow-lg transition"
              >
                <div className="flex items-start justify-between gap-4 mb-3">
                  <h3 className="text-xl font-serif font-bold text-navy-900 dark:text-navy-50">
                    {course.title}
                  </h3>
                  <span className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-navy-100 dark:bg-navy-800 text-navy-700 dark:text-navy-200 text-xs font-medium">
                    <Clock className="w-3.5 h-3.5" /> {course.duration}
                  </span>
                </div>
                <p className="text-sm text-navy-600 dark:text-navy-300 leading-relaxed">
                  {course.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-8">
            <BookOpen className="w-7 h-7 text-gold-600 dark:text-gold-400" />
            <h2 className="text-3xl font-serif font-bold text-navy-900 dark:text-navy-50">
              Curriculum Overview
            </h2>
          </div>
          <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-md border border-navy-100 dark:border-navy-800 p-6 sm:p-8">
            <p className="text-navy-700 dark:text-navy-200 mb-6 leading-relaxed">
              Our curriculum is designed to provide a balanced and thorough theological education,
              integrating academic rigor with spiritual formation and practical ministry skills.
              Students engage with the following core areas of study:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {CURRICULUM.map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-navy-600 dark:text-gold-400 flex-shrink-0" />
                  <span className="text-sm text-navy-700 dark:text-navy-200">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-8">
            <ClipboardCheck className="w-7 h-7 text-gold-600 dark:text-gold-400" />
            <h2 className="text-3xl font-serif font-bold text-navy-900 dark:text-navy-50">
              Admission Requirements
            </h2>
          </div>
          <div className="bg-white dark:bg-navy-900 rounded-2xl shadow-md border border-navy-100 dark:border-navy-800 p-6 sm:p-8">
            <ol className="space-y-4">
              {REQUIREMENTS.map((req, i) => (
                <li key={i} className="flex items-start gap-4">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-navy-600 text-white flex items-center justify-center text-sm font-bold">
                    {i + 1}
                  </span>
                  <span className="text-sm text-navy-700 dark:text-navy-200 pt-0.5">{req}</span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-8">
            <Calendar className="w-7 h-7 text-gold-600 dark:text-gold-400" />
            <h2 className="text-3xl font-serif font-bold text-navy-900 dark:text-navy-50">
              Academic Calendar
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CALENDAR.map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.term}
                  className="bg-white dark:bg-navy-900 rounded-xl shadow-sm border border-navy-100 dark:border-navy-800 p-5"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className="w-5 h-5 text-navy-600 dark:text-gold-400" />
                    <h3 className="text-sm font-semibold text-navy-900 dark:text-navy-50">
                      {item.term}
                    </h3>
                  </div>
                  <p className="text-sm text-navy-600 dark:text-navy-300">{item.period}</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
