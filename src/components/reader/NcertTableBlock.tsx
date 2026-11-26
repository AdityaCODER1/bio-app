import type { EquationBlock, NcertTableBlock } from '../../types/study';

export function NcertTableCard({ block }: { block: NcertTableBlock }) {
  return (
    <div className="ncert-table-card" id={block.id}>
      <div className="ncert-table-head">
        <div className="ncert-table-title">
          <span>{block.tableNumber}</span>
          {block.title}
        </div>
        <span className="micro-badge">NCERT p.{block.ncertPage}</span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table className="ncert-table">
          <thead>
            <tr>
              {block.headers.map((h, i) => (
                <th key={i}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {block.rows.map((row, rIdx) => (
              <tr key={rIdx}>
                {row.map((cell, cIdx) => (
                  <td key={cIdx}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {block.footnote && <div className="ncert-table-footnote">{block.footnote}</div>}
    </div>
  );
}

export function EquationCard({ block }: { block: EquationBlock }) {
  return (
    <div className="equation-card" id={block.id}>
      {block.label && <div className="equation-label">{block.label}</div>}
      <div className="equation-formula">{block.equation}</div>
      {block.subtext && <div className="equation-subtext">{block.subtext}</div>}
    </div>
  );
}
