/** Painel de erros e avisos (§10.1). Clicar em um item leva ao ponto do problema. */

export class ValidationPanel {
  constructor(element, summaryElement, options) {
    this.element = element;
    this.summaryElement = summaryElement;
    this.options = options;
  }

  render(report) {
    const { errors, warnings } = report;

    this.summaryElement.replaceChildren();
    const summary = document.createElement('span');
    if (errors.length === 0 && warnings.length === 0) {
      summary.textContent = 'Nenhum problema encontrado.';
    } else {
      const parts = [];
      if (errors.length) parts.push(`${errors.length} erro${errors.length > 1 ? 's' : ''}`);
      if (warnings.length) parts.push(`${warnings.length} aviso${warnings.length > 1 ? 's' : ''}`);
      summary.textContent = parts.join(' · ');
    }
    this.summaryElement.appendChild(summary);

    this.element.replaceChildren();

    if (errors.length === 0 && warnings.length === 0) {
      const ok = document.createElement('p');
      ok.className = 'validation__ok';
      ok.textContent = 'Estrutura e cobertura validadas. O pacote final pode ser exportado.';
      this.element.appendChild(ok);
      return;
    }

    for (const issue of errors) this.element.appendChild(this.renderIssue(issue, 'error'));
    for (const issue of warnings) this.element.appendChild(this.renderIssue(issue, 'warning'));
  }

  renderIssue(issue, kind) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `issue issue--${kind}`;

    const label = document.createElement('span');
    label.className = 'issue__kind';
    label.textContent = kind === 'error' ? 'Erro' : 'Aviso';

    const message = document.createElement('span');
    message.className = 'issue__message';
    message.textContent = issue.message;

    button.append(label, message);

    if (issue.scenario) {
      const action = document.createElement('span');
      action.className = 'issue__action';
      action.textContent = 'abrir no simulador →';
      button.appendChild(action);
    }

    button.addEventListener('click', () => this.options.onSelect(issue));
    return button;
  }
}
