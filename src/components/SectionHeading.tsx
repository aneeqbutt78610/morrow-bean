interface Props { eyebrow?: string; title: string; description?: string; align?: 'left' | 'center'; light?: boolean }
export default function SectionHeading({ eyebrow, title, description, align = 'left', light = false }: Props) {
  return <div className={`section-heading section-heading--${align} ${light ? 'section-heading--light' : ''}`}>
    {eyebrow && <p className="eyebrow">{eyebrow}</p>}
    <h2>{title}</h2>
    {description && <p className="section-heading__description">{description}</p>}
  </div>;
}
