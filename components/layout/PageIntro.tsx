type Props = {
  eyebrow?: string;
  title: string;
  description: string;
};

export function PageIntro({ eyebrow = "Workspace", title, description }: Props) {
  return (
    <div className="dash-page-header">
      <span className="badge accent">{eyebrow}</span>
      <div className="stack-sm">
        <h1 className="dash-page-title">{title}</h1>
        <p className="dash-page-subtitle">{description}</p>
      </div>
    </div>
  );
}
