/* Server-authoritative hint count; one count per unique hint. */
window.BreakHint = {
  get() { return Number(localStorage.getItem('break_hint_count')) || 0; },
  async add(room,mission,level=1) {
    const result=await BreakAPI.hint(room,mission,level);
    localStorage.setItem('break_hint_count',String(result.hintCount));
    this.render();
    return result;
  },
  render() {const el=document.getElementById('hintTotal');if(el)el.textContent=this.get();}
};
document.addEventListener('DOMContentLoaded',()=>BreakHint.render());
