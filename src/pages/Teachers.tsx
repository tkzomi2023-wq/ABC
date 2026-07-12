import { useEffect, useState, useCallback } from 'react';
import { GraduationCap, BookOpen, User, CircleAlert as AlertCircle } from 'lucide-react';
import { supabase, Teacher, BoardMember } from '../lib/supabase';
import ResponsiveImage from '../components/ResponsiveImage';
import LoadingSpinner from '../components/LoadingSpinner';

const DEFAULT_TEACHER_PHOTO = 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400';
const DEFAULT_BOARD_PHOTO = 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400';

export default function Teachers() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentTeachers, setCurrentTeachers] = useState<Teacher[]>([]);
  const [formerTeachers, setFormerTeachers] = useState<Teacher[]>([]);
  const [boardMembers, setBoardMembers] = useState<BoardMember[]>([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [teachersResult, boardResult] = await Promise.all([
        supabase
          .from('teachers')
          .select('*')
          .order('display_order', { ascending: true }),
        supabase
          .from('board_members')
          .select('*')
          .order('display_order', { ascending: true }),
      ]);

      if (teachersResult.error) throw teachersResult.error;
      if (boardResult.error) throw boardResult.error;

      const allTeachers = (teachersResult.data || []) as Teacher[];
      setCurrentTeachers(allTeachers.filter((t) => t.is_current));
      setFormerTeachers(allTeachers.filter((t) => !t.is_current));
      setBoardMembers((boardResult.data || []) as BoardMember[]);
    } catch (err) {
      console.error('Error fetching faculty data:', err);
      setError('Failed to load faculty information. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) return <LoadingSpinner message="Loading faculty..." />;

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <p className="text-red-500 dark:text-red-400 text-center">{error}</p>
        <button
          onClick={fetchData}
          className="px-4 py-2 rounded-lg bg-navy-700 text-white text-sm font-medium hover:bg-navy-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const TeacherCard = ({ teacher }: { teacher: Teacher }) => (
    <article className="bg-white dark:bg-slate-800 rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-shadow flex flex-col">
      <div className="aspect-square overflow-hidden bg-slate-100 dark:bg-slate-700">
        {teacher.photo_url ? (
          <ResponsiveImage
            src={teacher.photo_url}
            alt={teacher.full_name}
            className="w-full h-full object-cover"
            widths={[200, 300, 400]}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            aspectRatio="1/1"
            fallbackSrc={DEFAULT_TEACHER_PHOTO}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-navy-100 dark:bg-navy-800">
            <User className="w-16 h-16 text-navy-300 dark:text-navy-600" />
          </div>
        )}
      </div>
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-serif text-lg font-bold text-navy-900 dark:text-white mb-1">
          {teacher.full_name}
        </h3>
        {teacher.subject_in_charge && (
          <p className="flex items-center gap-1.5 text-sm text-navy-600 dark:text-gold-400 mb-2">
            <BookOpen className="w-4 h-4" />
            {teacher.subject_in_charge}
          </p>
        )}
        {teacher.qualification && (
          <p className="flex items-start gap-1.5 text-sm text-slate-500 dark:text-slate-400 mb-3">
            <GraduationCap className="w-4 h-4 mt-0.5 flex-shrink-0" />
            {teacher.qualification}
          </p>
        )}
        {teacher.bio && (
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-4 flex-1">
            {teacher.bio}
          </p>
        )}
        {teacher.joined_at && (
          <p className="text-xs text-slate-400 dark:text-slate-500 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700">
            {teacher.left_at
              ? `Served: ${new Date(teacher.joined_at).getFullYear()} – ${new Date(teacher.left_at).getFullYear()}`
              : `Joined: ${new Date(teacher.joined_at).getFullYear()}`}
          </p>
        )}
      </div>
    </article>
  );

  return (
    <div>
      {/* Hero Header */}
      <section className="bg-navy-900 dark:bg-navy-950 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-white mb-4">
            Our Faculty
          </h1>
          <p className="text-slate-300 max-w-2xl mx-auto">
            Dedicated educators and servants of God committed to training the next generation of Christian leaders.
          </p>
        </div>
      </section>

      {/* Current Teachers */}
      <section className="py-16 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-navy-900 dark:text-white mb-2">
              Current Faculty
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
              Meet the teachers who are currently serving at Aizawl Bible College.
            </p>
          </div>

          {currentTeachers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <User className="w-12 h-12 text-slate-300 dark:text-slate-600 mb-4" />
              <p className="text-slate-500 dark:text-slate-400">No current faculty members listed yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {currentTeachers.map((teacher) => (
                <TeacherCard key={teacher.id} teacher={teacher} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Board Members */}
      {boardMembers.length > 0 && (
        <section className="py-16 bg-white dark:bg-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-10">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-navy-900 dark:text-white mb-2">
                Board Members
              </h2>
              <p className="text-slate-500 dark:text-slate-400">
                The leadership board guiding the vision and direction of our college.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {boardMembers.map((member) => (
                <article
                  key={member.id}
                  className="bg-slate-50 dark:bg-slate-700/50 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow text-center"
                >
                  <div className="aspect-square overflow-hidden bg-slate-200 dark:bg-slate-700">
                    {member.photo_url ? (
                      <ResponsiveImage
                        src={member.photo_url}
                        alt={member.name}
                        className="w-full h-full object-cover"
                        widths={[200, 300, 400]}
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                        aspectRatio="1/1"
                        fallbackSrc={DEFAULT_BOARD_PHOTO}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-navy-100 dark:bg-navy-800">
                        <User className="w-12 h-12 text-navy-300 dark:text-navy-600" />
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="font-serif text-base font-bold text-navy-900 dark:text-white mb-1">
                      {member.name}
                    </h3>
                    {member.designation && (
                      <p className="text-xs text-navy-600 dark:text-gold-400">
                        {member.designation}
                      </p>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Former Teachers */}
      {formerTeachers.length > 0 && (
        <section className="py-16 bg-slate-50 dark:bg-slate-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-10">
              <h2 className="font-serif text-2xl sm:text-3xl font-bold text-navy-900 dark:text-white mb-2">
                Former Faculty
              </h2>
              <p className="text-slate-500 dark:text-slate-400">
                Honoring those who have served faithfully in the past.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {formerTeachers.map((teacher) => (
                <TeacherCard key={teacher.id} teacher={teacher} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
