import { Heart, Mail, MapPin, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { siteContact } from "../../../config/siteContact";

const DashboardFooter = () => (
  <footer className="border-t border-[#dce9e2] bg-white">
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-9 sm:grid-cols-2 sm:px-6 lg:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
      <div>
        <Link to="/" className="inline-flex items-center gap-2.5" aria-label="Little Steps home">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#e3f3ed] text-[#278a70]">
            <Heart size={19} strokeWidth={2.5} />
          </span>
          <span className="font-sans text-lg font-extrabold tracking-tight text-[#26384b]">
            Little <span className="text-[#278a70]">Steps</span>
          </span>
        </Link>
        <p className="mt-3 max-w-sm text-sm leading-6 text-[#687a88]">
          Thoughtful childcare discovery to help every family find care with confidence.
        </p>
        <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#81929b]">
          <MapPin size={13} /> Built for families, one step at a time.
        </p>
      </div>

      <div>
        <h2 className="text-sm font-bold text-[#26384b]">Contact</h2>
        <ul className="mt-3 space-y-2.5 text-sm text-[#687a88]">
          <li>
            <a className="inline-flex items-center gap-2 transition hover:text-[#278a70]" href={`mailto:${siteContact.email}`}>
              <Mail size={15} className="text-[#278a70]" /> {siteContact.email}
            </a>
          </li>
          <li>
            <a className="inline-flex items-center gap-2 transition hover:text-[#278a70]" href={`tel:${siteContact.phone.replaceAll(" ", "")}`}>
              <Phone size={15} className="text-[#278a70]" /> {siteContact.phone}
            </a>
          </li>
        </ul>
        <p className="mt-2 text-xs leading-5 text-[#9a6b27]">
          Placeholder contact details — replace before launch.
        </p>
      </div>

      <div>
        <h2 className="text-sm font-bold text-[#26384b]">Information</h2>
        <nav className="mt-3 flex flex-col items-start gap-2.5 text-sm text-[#687a88]" aria-label="Footer">
          <Link className="transition hover:text-[#278a70]" to="/contact">Contact us</Link>
          <Link className="transition hover:text-[#278a70]" to="/privacy">Privacy policy</Link>
          <Link className="transition hover:text-[#278a70]" to="/terms">Terms &amp; conditions</Link>
          <Link className="transition hover:text-[#278a70]" to="/trust-and-safety">Trust &amp; safety</Link>
        </nav>
      </div>
    </div>

    <div className="border-t border-[#eaf1ed]">
      <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-xs text-[#81929b] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <p>© 2026 Little Steps. All rights reserved.</p>
        <p>Family-first childcare discovery.</p>
      </div>
    </div>
  </footer>
);

export default DashboardFooter;
