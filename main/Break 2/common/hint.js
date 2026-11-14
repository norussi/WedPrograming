/* [통합] 누적 힌트: HTML → CSS → JS 방까지 break_hint_count 하나로 계속 셈 */
window.BreakHint = {
  get() { return Number(localStorage.getItem('break_hint_count')) || 0; },
  add() { localStorage.setItem('break_hint_count', String(this.get() + 1)); this.render(); },
  render() { const el = document.getElementById('hintTotal'); if (el) el.textContent = this.get(); }
};
document.addEventListener('DOMContentLoaded', () => BreakHint.render());
