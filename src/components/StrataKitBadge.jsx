import logoUrl from '../assets/stratakit-logo.svg';

// Small "built with StrataKit" mark in the globe corner, mirroring Cesium's credit.
// Plain anchor styled in App.css so the badge look isn't fought by link theming.
export default function StrataKitBadge() {
  return (
    <a
      href="https://stratakit.bentley.com/"
      target="_blank"
      rel="noreferrer"
      className="stratakit-badge"
      aria-label="Built with StrataKit, Bentley's design system"
    >
      <span className="stratakit-mark" style={{ '--logo': `url("${logoUrl}")` }} aria-hidden="true" />
      <span>StrataKit</span>
    </a>
  );
}
