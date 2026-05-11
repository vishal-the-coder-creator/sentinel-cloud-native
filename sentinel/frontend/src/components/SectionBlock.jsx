export default function SectionBlock({ eyebrow, title, description, children }) {
  return (
    <section className="section-block">
      <div className="section-block__header">
        <div>
          <p className="section-kicker">{eyebrow}</p>
          <h2>{title}</h2>
        </div>
        {description ? <p className="section-block__description">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
