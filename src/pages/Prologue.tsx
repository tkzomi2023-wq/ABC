import { BookOpen, Scroll, Heart, Compass } from 'lucide-react';

export default function Prologue() {
  return (
    <div className="min-h-screen bg-navy-50 dark:bg-navy-950">
      <section className="relative bg-navy-800 dark:bg-navy-900 text-white py-20 px-4">
        <div className="absolute inset-0 bg-gradient-to-b from-navy-900/50 to-navy-800/0" />
        <div className="relative max-w-4xl mx-auto text-center">
          <BookOpen className="w-12 h-12 text-gold-400 mx-auto mb-4" />
          <h1 className="text-4xl sm:text-5xl font-serif font-bold mb-4">Prologue</h1>
          <p className="text-navy-100 dark:text-navy-300 text-lg">
            The story, vision, and mission of Aizawl Bible College
          </p>
        </div>
      </section>

      <article className="max-w-3xl mx-auto px-4 py-12 space-y-12">
        <section>
          <div className="flex items-center gap-3 mb-4">
            <Scroll className="w-6 h-6 text-gold-600 dark:text-gold-400" />
            <h2 className="text-2xl font-serif font-bold text-navy-900 dark:text-navy-50">
              Our Founding
            </h2>
          </div>
          <div className="space-y-4 text-navy-700 dark:text-navy-200 leading-relaxed">
            <p>
              Aizawl Bible College was established with a singular vision: to equip men and women
              for faithful Christian ministry in Mizoram and beyond. Founded in the heart of
              Aizawl, the college emerged from a deep burden to provide rigorous theological
              training rooted in the Word of God and the power of the Holy Spirit.
            </p>
            <p>
              The institution traces its origins to a small group of pastors and church leaders
              who recognized the growing need for trained, Spirit-filled ministers in the region.
              What began as a modest Bible study initiative has, through God&apos;s grace, grown into
              a respected theological college serving students from across Northeast India and
              neighboring countries.
            </p>
            <p>
              From its earliest days, the college has been affiliated with the Assemblies of God
              movement, drawing on a rich Pentecostal heritage while maintaining a firm commitment
              to biblical orthodoxy and academic excellence.
            </p>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-6 h-6 text-gold-600 dark:text-gold-400" />
            <h2 className="text-2xl font-serif font-bold text-navy-900 dark:text-navy-50">
              Our History
            </h2>
          </div>
          <div className="space-y-4 text-navy-700 dark:text-navy-200 leading-relaxed">
            <p>
              Over the decades, Aizawl Bible College has passed through many seasons of growth and
              challenge. Each chapter of our history has been marked by God&apos;s faithfulness and
              the dedication of faculty, staff, and students who have given themselves to the
              work of theological education.
            </p>
            <p>
              The college has continually expanded its academic programs, moving from a single
              certificate course to offering diplomas, bachelor&apos;s degrees, and master&apos;s
              programs in theology and divinity. Our campus has grown to include a library,
              chapel, classrooms, and residential facilities that support a vibrant community
              of learning and worship.
            </p>
            <p>
              Hundreds of graduates have gone on to serve as pastors, missionaries, educators,
              and lay leaders in churches and organizations across India and around the world.
              Their lives and ministries stand as a testimony to the enduring value of the
              training received at Aizawl Bible College.
            </p>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-4">
            <Heart className="w-6 h-6 text-gold-600 dark:text-gold-400" />
            <h2 className="text-2xl font-serif font-bold text-navy-900 dark:text-navy-50">
              Our Mission
            </h2>
          </div>
          <div className="space-y-4 text-navy-700 dark:text-navy-200 leading-relaxed">
            <p>
              The mission of Aizawl Bible College is to glorify God by preparing men and women for
              effective Christian ministry through biblically grounded, academically rigorous, and
              spiritually formative education. We seek to nurture servant-leaders who love God
              wholeheartedly, love people compassionately, and serve the church faithfully.
            </p>
            <p>
              We are committed to the holistic development of every student—intellectual, spiritual,
              emotional, and practical—so that graduates are equipped not only with knowledge but
              also with the character and skills needed for a lifetime of fruitful ministry.
            </p>
          </div>
        </section>

        <section>
          <div className="flex items-center gap-3 mb-4">
            <Compass className="w-6 h-6 text-gold-600 dark:text-gold-400" />
            <h2 className="text-2xl font-serif font-bold text-navy-900 dark:text-navy-50">
              Our Vision for the Future
            </h2>
          </div>
          <div className="space-y-4 text-navy-700 dark:text-navy-200 leading-relaxed">
            <p>
              Looking ahead, Aizawl Bible College remains steadfast in its commitment to train the
              next generation of Christian leaders. We continue to seek God&apos;s guidance as we
              expand our programs, deepen our partnerships, and extend our reach to new communities
              and nations.
            </p>
            <p>
              We envision a future where our graduates serve as transformative agents of the Gospel
              in their churches, communities, and the world—carrying forward the light of Christ
              with integrity, compassion, and boldness.
            </p>
          </div>
        </section>
      </article>
    </div>
  );
}
