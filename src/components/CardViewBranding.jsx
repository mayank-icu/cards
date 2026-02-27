import './CardViewHeader.css';

const CardViewBranding = () => {
  return (
    <a
      className="card-view-branding"
      href="/"
      target="_blank"
      rel="noreferrer"
    >
      <img src="/logo.webp" alt="EGreet" />
      <span>Made with EGreet. Create your own free card.</span>
    </a>
  );
};

export default CardViewBranding;
