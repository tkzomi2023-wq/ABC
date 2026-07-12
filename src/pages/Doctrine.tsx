import { BookOpen, Cross, Flame, Shield, Globe, Hand, Crown, Bird, Church } from 'lucide-react';

type Belief = {
  icon: typeof BookOpen;
  title: string;
  description: string;
};

const BELIEFS: Belief[] = [
  {
    icon: BookOpen,
    title: 'The Scriptures Inspired',
    description:
      'We believe the Bible is the inspired and authoritative Word of God, the infallible rule of faith and conduct, and the supreme standard by which all human conduct, creeds, and opinions shall be tried.',
  },
  {
    icon: Cross,
    title: 'The One True God',
    description:
      'We believe in one eternally existing, infinite God, the Creator and Sustainer of all things, who has revealed Himself as the triune Godhead—Father, Son, and Holy Spirit.',
  },
  {
    icon: Bird,
    title: 'The Deity of the Lord Jesus Christ',
    description:
      'We believe in the Lord Jesus Christ as the eternal Son of God, conceived of the Holy Spirit, born of the Virgin Mary, fully God and fully man, who lived a sinless life, died on the cross for our sins, rose bodily from the dead, and ascended to the right hand of the Father.',
  },
  {
    icon: Flame,
    title: 'The Fall of Man',
    description:
      'We believe that man was created good and upright in the image of God, but by voluntary transgression fell from his original state, thereby incurring both physical and spiritual death and separation from God.',
  },
  {
    icon: Shield,
    title: 'The Salvation of Man',
    description:
      'We believe that salvation is received through repentance toward God and faith in the Lord Jesus Christ, resulting in regeneration by the Holy Spirit, justification by grace through faith, and the gift of eternal life.',
  },
  {
    icon: Hand,
    title: 'The Ordinances of the Church',
    description:
      'We believe in the ordinance of water baptism by immersion, symbolizing the believer\'s identification with Christ in His death and resurrection, and the ordinance of the Lord\'s Supper (Holy Communion) as a memorial of His suffering and death.',
  },
  {
    icon: Flame,
    title: 'The Baptism in the Holy Spirit',
    description:
      'We believe in the baptism in the Holy Spirit as a distinct experience subsequent to salvation, empowering believers for life and service, with the initial physical evidence of speaking in other tongues as the Spirit gives utterance.',
  },
  {
    icon: Shield,
    title: 'Sanctification',
    description:
      'We believe in sanctification as an act of separation from evil and dedication to God, accomplished through the Word of God and the Holy Spirit, resulting in a life of holiness and Christlikeness.',
  },
  {
    icon: Cross,
    title: 'The Church and Its Mission',
    description:
      'We believe that the Church is the body of Christ, a living spiritual body of which Christ is the Head, and that its mission is to be an agency of God for evangelizing the world, worshiping God, and building up the saints.',
  },
  {
    icon: Crown,
    title: 'The Ministry and Evangelism',
    description:
      'We believe in a divinely called and scripturally ordained ministry, provided by our Lord for the evangelization of the world and the edification of the Church, equipping saints for the work of the ministry.',
  },
  {
    icon: Bird,
    title: 'Divine Healing',
    description:
      'We believe that deliverance from sickness is provided for in the atonement of Christ and is the privilege of all believers, who may pray for healing according to the will of God.',
  },
  {
    icon: Crown,
    title: 'The Blessed Hope',
    description:
      'We believe in the blessed hope—the rapture of the Church at Christ&apos;s coming—when the dead in Christ shall rise first, and we who are alive and remain shall be caught up to meet the Lord in the air.',
  },
  {
    icon: Cross,
    title: 'The Millennial Reign of Christ',
    description:
      'We believe in the second coming of Christ with His saints to establish His millennial kingdom on earth, bringing visible and universal reign of peace and righteousness.',
  },
  {
    icon: Flame,
    title: 'The Final Judgment',
    description:
      'We believe in the final judgment, when the wicked dead will be raised and judged according to their works, and will be consigned to everlasting punishment in the lake of fire, which is the second death.',
  },
  {
    icon: Globe,
    title: 'The New Heavens and New Earth',
    description:
      'We believe in the promise of a new heavens and a new earth, wherein dwells righteousness, the eternal home of the redeemed, where God will dwell with His people forever in perfect fellowship and glory.',
  },
];

export default function Doctrine() {
  return (
    <div className="min-h-screen bg-navy-50 dark:bg-navy-950">
      <section className="bg-navy-800 dark:bg-navy-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <Church className="w-12 h-12 text-gold-400 mx-auto mb-4" />
          <h1 className="text-4xl sm:text-5xl font-serif font-bold mb-4">Our Doctrine</h1>
          <p className="text-navy-100 dark:text-navy-300 text-lg">
            The fundamental truths we believe and teach at Aizawl Bible College
          </p>
        </div>
      </section>

      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="mb-10 text-center">
          <p className="text-navy-700 dark:text-navy-200 leading-relaxed max-w-2xl mx-auto">
            Aizawl Bible College stands on the foundation of the Assemblies of God sixteen
            fundamental truths. These doctrines guide our teaching, shape our community, and
            anchor our faith in the unchanging Word of God.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {BELIEFS.map((belief, index) => {
            const Icon = belief.icon;
            return (
              <article
                key={belief.title}
                className="bg-white dark:bg-navy-900 rounded-2xl shadow-md border border-navy-100 dark:border-navy-800 p-6 hover:shadow-lg transition"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-navy-100 dark:bg-navy-800 flex items-center justify-center">
                    <Icon className="w-6 h-6 text-navy-600 dark:text-gold-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-serif font-bold text-navy-900 dark:text-navy-50 mb-2">
                      <span className="text-gold-600 dark:text-gold-400 text-sm font-sans mr-2">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      {belief.title}
                    </h2>
                    <p className="text-sm text-navy-600 dark:text-navy-300 leading-relaxed">
                      {belief.description}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
