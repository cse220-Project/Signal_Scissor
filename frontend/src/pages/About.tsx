import { GraduationCap, Radio } from 'lucide-react';

type Member = {
  name: string;
  studentId: string;
  photo: string;
  links: { label: string; href: string; kind: 'facebook' | 'instagram' | 'github' }[];
};

const members: Member[] = [
  {
    name: 'Safwan Bin Ahmadul Hoque',
    studentId: '2305087',
    photo: '/assets/safwan.png',
    links: [
      { label: 'Facebook', href: 'https://facebook.com/safwan.mahdi.90', kind: 'facebook' },
      { label: 'Instagram', href: 'https://www.instagram.com/safwan__mahdi/', kind: 'instagram' },
      { label: 'GitHub', href: 'https://github.com/Safwan00143', kind: 'github' },
    ],
  },
  {
    name: 'Al Arafat Alif',
    studentId: '2305062',
    photo: '/assets/alif.jpeg',
    links: [
      { label: 'Facebook', href: 'https://facebook.com/al.arafat.alif.2025', kind: 'facebook' },
      { label: 'Instagram', href: 'https://www.instagram.com/_an_inertman_/', kind: 'instagram' },
      { label: 'GitHub', href: 'https://github.com/alarafatalif', kind: 'github' },
    ],
  },
];

function SocialIcon({ kind }: { kind: Member['links'][number]['kind'] }) {
  if (kind === 'facebook') {
    return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.65 21v-8.2h2.75l.41-3.19h-3.16V7.58c0-.92.26-1.55 1.58-1.55h1.69V3.18c-.29-.04-1.29-.12-2.46-.12-2.43 0-4.1 1.49-4.1 4.22v2.33H7.61v3.19h2.75V21h3.29Z" /></svg>;
  }
  if (kind === 'instagram') {
    return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><circle cx="17.5" cy="6.5" r=".75" fill="currentColor" stroke="none" /></svg>;
  }
  return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2C6.48 2 2 6.58 2 12.23c0 4.52 2.87 8.35 6.84 9.7.5.1.68-.22.68-.49 0-.24-.01-1.05-.01-1.9-2.78.62-3.37-1.2-3.37-1.2-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .07 1.53 1.06 1.53 1.06.9 1.56 2.35 1.11 2.92.85.09-.67.35-1.11.64-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.31.1-2.73 0 0 .84-.28 2.75 1.05A9.3 9.3 0 0 1 12 6.1c.85 0 1.7.12 2.5.35 1.9-1.33 2.74-1.05 2.74-1.05.55 1.42.2 2.47.1 2.73.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.93.68 1.87 0 1.35-.01 2.44-.01 2.78 0 .27.18.59.69.49A10.24 10.24 0 0 0 22 12.23C22 6.58 17.52 2 12 2Z" /></svg>;
}

export default function About() {
  return (
    <div className="max-w-5xl mx-auto pb-20 md:pb-28 animate-in fade-in duration-300">
      <header className="border-b border-hairline px-2 py-12 md:py-16">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-wider uppercase text-ink-tertiary">
            <Radio size={14} /> Signal Scissors
          </div>
          <h1 className="mt-4 text-3xl md:text-4xl font-semibold tracking-tight text-ink-primary">About the App</h1>
          <p className="mt-5 text-[15px] leading-8 text-ink-secondary">
            Signal Scissors is an interactive digital signal-processing workstation designed for learning through exploration. It brings audio signals, waveforms, and spectra into one focused workspace, where users can see how an operation changes a signal before they hear the result. From generating clean tones to loading real recordings, the app makes it straightforward to inspect both the time and frequency domains.
          </p>
          <p className="mt-5 text-[15px] leading-8 text-ink-secondary">
            Its tools cover the essential building blocks of the course: Fourier-domain filtering, amplitude scaling, delay, frequency translation, and convolution-based echo. By pairing each transformation with responsive graphs and immediate playback, Signal Scissors turns mathematical ideas into a practical, visual audio lab.
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-2 py-16 md:py-24">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent text-ink-primary">
            <GraduationCap size={21} />
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-ink-primary">About Us</h2>
            <p className="mt-3 max-w-3xl text-[15px] leading-8 text-ink-secondary">
              We are students of the Department of Computer Science and Engineering at Bangladesh University of Engineering and Technology (BUET). We created Signal Scissors for our Signals (CSE 220) sessional course in Level 2, Term 2.
            </p>
            <p className="mt-6 max-w-3xl text-[15px] leading-8 text-ink-secondary">
              Our goal was to make the ideas behind a signals course feel tangible. Instead of treating a waveform or Fourier transform as a static equation, the app lets users load, generate, inspect, filter, shift, and compare audio in real time. The visual tools connect each operation to its time-domain and frequency-domain result, helping turn theory into an experiment that can be both seen and heard.
            </p>
          </div>
        </div>
      </section>

      <section aria-labelledby="team-heading" className="border-t border-hairline pt-20 md:pt-28">
        <div className="mb-12">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-tertiary">The people behind the project</p>
          <h2 id="team-heading" className="mt-1 text-2xl font-semibold tracking-tight text-ink-primary">Meet the team</h2>
        </div>
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-16">
          {members.map((member) => (
            <article key={member.studentId} className="text-center">
              <img
                src={member.photo}
                alt={member.name}
                width={96}
                height={96}
                loading="eager"
                decoding="sync"
                className="mx-auto h-24 w-24 rounded-full border-4 border-accent object-cover object-center shadow-sm"
                style={{ imageRendering: 'auto' }}
              />
              <h3 className="mt-5 text-[2.1rem] leading-none text-ink-primary" style={{ fontFamily: "'Brittany Signature', cursive", fontWeight: 700 }}>{member.name}</h3>
              <p className="mt-8 text-[15px] font-medium text-ink-secondary">CSE, BUET</p>
              <p className="mt-1 font-mono text-[14px] font-medium text-ink-tertiary">ID: {member.studentId}</p>
              <p className="mt-7 text-[13px] font-semibold text-ink-secondary">You can find me in</p>
              <div className="mt-3 flex justify-center gap-4">
                {member.links.map(({ label, href, kind }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`${member.name} on ${label}`}
                    title={label}
                    className="inline-flex h-12 w-12 items-center justify-center rounded-full text-ink-secondary transition-colors hover:text-ink-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="h-6 w-6"><SocialIcon kind={kind} /></span>
                  </a>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
