import { useEffect, useState, useCallback } from 'react';
import { Target, Eye, Heart, BookOpen, Users, Award } from 'lucide-react';
import { supabase, SiteSetting } from '../lib/supabase';
import ResponsiveImage from '../components/ResponsiveImage';
import LoadingSpinner from '../components/LoadingSpinner';

const DEFAULT_HERO_IMAGE = 'https://images.pexels.com/photos/289737/pexels-photo-289737.jpeg?auto=compress&cs=tinysrgb&w=1600';
const DEFAULT_IMAGES = [
  'https://images.pexels.com/photos/256531/pexels-photo-256531.jpeg?auto=compress&cs=tinysrgb&w=600',
  'https://images.pexels.com/photos/301926/pexels-photo-301926.jpeg?auto=compress&cs=tinysrgb&w=600',
  'https://images.pexels.com/photos/267885/pexels-photo-267885.jpeg?auto=compress&cs=tinysrgb&w=600',
  'https://images.pexels.com/photos/159740/books-bookstore-book-reading-159740.jpeg?auto=compress&cs=tinysrgb&w=600',
];

const SETTING_KEYS = ['about_hero_image', 'about_image_1', 'about_image_2', 'about_image_3', 'about_image_4'];

type ValuesItem = {
  icon: typeof BookOpen;
  title: string;
  description: string;
};

const VALUES: ValuesItem[] = [
  {
    icon: BookOpen,
    title: 'Biblical Authority',
    description: 'We uphold the Bible as the inspired, infallible, and authoritative Word of God, the foundation of all our teaching and practice.',
  },
  {
    icon: Heart,
    title: 'Christ-Centered',
    description: 'We are committed to knowing Christ and making Him known, nurturing a personal relationship with our Lord and Savior.',
  },
  {
    icon: Users,
    title: 'Community Life',
    description: 'We foster a loving community where students grow together in faith, fellowship, and mutual support.',
  },
  {
    icon: Award,
    title: 'Academic Excellence',
    description: 'We pursue rigorous theological education, equipping students with knowledge and skills for effective ministry.',
  },
];

export default function AboutUs() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [heroImage, setHeroImage] = useState(DEFAULT_HERO_IMAGE);
  const [images, setImages] = useState<string[]>(DEFAULT_IMAGES);

  const fetchSettings = useCallback(async () => {
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .in('setting_key', SETTING_KEYS);

    if (error) throw error;

    const settings = (data || []) as SiteSetting[];
    const settingsMap = new Map(settings.map((s) => [s.setting_key, s.setting_value]));

    if (settingsMap.get('about_hero_image')) setHeroImage(settingsMap.get('about_hero_image')!);

    const newImages = [...DEFAULT_IMAGES];
    for (let i = 0; i < 4; i++) {
      const key = `about_image_${i + 1}`;
      if (settingsMap.get(key)) newImages[i] = settingsMap.get(key)!;
    }
    setImages(newImages);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await fetchSettings();
      } catch (err) {
        console.error('Error fetching about page data:', err);
        setError('Failed to load page content. Please try again.');
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchSettings]);

  if (loading) return <LoadingSpinner message="Loading about page..." />;
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <p className="text-red-500 dark:text-red-400 text-center">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-lg bg-navy-700 text-white text-sm font-medium hover:bg-navy-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="relative h-[50vh] min-h-[350px] w-full overflow-hidden">
        <div className="absolute inset-0">
          <ResponsiveImage
            src={heroImage}
            alt="Aizawl Bible College"
            className="w-full h-full object-cover"
            loading="eager"
            widths={[800, 1200, 1600, 1920]}
            sizes="100vw"
            fallbackSrc={DEFAULT_HERO_IMAGE}
          />
        </div>
        <div className="absolute inset-0 bg-navy-950/60" />
        <div className="relative h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center items-center text-center">
          <h1 className="font-serif text-4xl sm:text-5xl font-bold text-white mb-4 drop-shadow-lg">
            About Us
          </h1>
          <p className="text-lg text-slate-200 max-w-2xl drop-shadow-md">
            Dedicated to biblical education and ministry training under the Assemblies of God Mizoram District.
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 bg-white dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-navy-100 dark:bg-navy-900 flex items-center justify-center">
                  <Target className="w-6 h-6 text-navy-700 dark:text-gold-400" />
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-navy-900 dark:text-white">
                  Our Mission
                </h2>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                The mission of Aizawl Bible College is to equip men and women for effective Christian ministry
                through biblically grounded education, practical training, and spiritual formation. We strive to
                develop servant-leaders who are deeply rooted in Scripture, empowered by the Holy Spirit, and
                committed to the Great Commission.
              </p>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed mt-4">
                We seek to prepare students not only for pastoral ministry but for all forms of Christian service,
                nurturing a heart for missions, evangelism, and church planting.
              </p>
            </div>
            <div className="rounded-2xl overflow-hidden shadow-xl">
              <ResponsiveImage
                src={images[0]}
                alt="College campus"
                className="w-full object-cover"
                widths={[400, 600, 800]}
                sizes="(max-width: 768px) 100vw, 50vw"
                aspectRatio="4/3"
                fallbackSrc={DEFAULT_IMAGES[0]}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-16 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 rounded-2xl overflow-hidden shadow-xl">
              <ResponsiveImage
                src={images[1]}
                alt="College community"
                className="w-full object-cover"
                widths={[400, 600, 800]}
                sizes="(max-width: 768px) 100vw, 50vw"
                aspectRatio="4/3"
                fallbackSrc={DEFAULT_IMAGES[1]}
              />
            </div>
            <div className="order-1 md:order-2">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-navy-100 dark:bg-navy-900 flex items-center justify-center">
                  <Eye className="w-6 h-6 text-navy-700 dark:text-gold-400" />
                </div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold text-navy-900 dark:text-white">
                  Our Vision
                </h2>
              </div>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                Our vision is to be a leading theological institution in Mizoram and beyond, recognized for
                academic excellence, spiritual vitality, and faithful service to the church. We envision
                graduates who are transformed by the gospel and equipped to transform their communities for Christ.
              </p>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed mt-4">
                We aim to be a center where the church's future leaders are shaped — men and women of integrity,
                deep faith, and practical wisdom, ready to serve God's people with compassion and courage.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-white dark:bg-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-navy-100 dark:bg-navy-900 flex items-center justify-center">
                <Heart className="w-6 h-6 text-navy-700 dark:text-gold-400" />
              </div>
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold text-navy-900 dark:text-white mb-4">
              Our Core Values
            </h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
              The principles that guide our community and shape every aspect of college life.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {VALUES.map((value) => {
              const Icon = value.icon;
              return (
                <div
                  key={value.title}
                  className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-6 text-center hover:shadow-md transition-shadow"
                >
                  <div className="w-14 h-14 rounded-full bg-navy-700 dark:bg-navy-800 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-7 h-7 text-gold-400" />
                  </div>
                  <h3 className="font-serif text-lg font-bold text-navy-900 dark:text-white mb-3">
                    {value.title}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    {value.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Image Grid */}
      <section className="py-16 bg-slate-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-navy-900 dark:text-white text-center mb-12">
            Life at Aizawl Bible College
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {images.map((img, idx) => (
              <div
                key={idx}
                className="rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-shadow"
              >
                <ResponsiveImage
                  src={img}
                  alt={`College life ${idx + 1}`}
                  className="w-full object-cover"
                  widths={[200, 400, 600]}
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
                  aspectRatio="1/1"
                  fallbackSrc={DEFAULT_IMAGES[idx]}
                />
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
