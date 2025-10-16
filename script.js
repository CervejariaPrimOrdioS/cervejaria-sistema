const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxrKN7Tr_cu5X-dzKzKfgdeuYxg9kLerQMN50r_bbj0b6SVayDBd2uxX2MW7N2-epGqeg/exec";
const LOGO_URL = "https://github.com/CervejariaPrimOrdioS/cervejaria-sistema/blob/main/logo.jpeg?raw=true";
let id_token = null;
let investimentos = [];

function formatarMoeda(valor) { return (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }); }
function showLoading(msg) { document.getElementById('loading-overlay').textContent = msg; document.getElementById('loading-overlay').style.display = 'flex'; }
function hideLoading() { document.getElementById('loading-overlay').style.display = 'none'; }

function handleCredentialResponse(response) {
    id_token = response.credential;
    const userPayload = JSON.parse(atob(id_token.split('.')[1]));
    document.getElementById('user-email').textContent = userPayload.email;
    document.getElementById('profile-pic').src = userPayload.picture;
    document.getElementById('tela-login').style.display = 'none';
    showLoading('Autenticando...');
    inicializarAplicacao();
}

function logout() {
    id_token = null;
    google.accounts.id.disableAutoSelect();
    document.getElementById('tela-principal').style.display = 'none';
    document.querySelectorAll('dialog').forEach(d => d.close());
    document.getElementById('tela-login').style.display = 'block';
}

async function carregarDados() {
    if (!id_token) { alert("Não autenticado!"); return; }
    showLoading('Buscando dados...');
    try {
        const response = await fetch(SCRIPT_URL + "?action=getInventario", { method: 'GET' });
        if (!response.ok) { throw new Error(`Erro na rede: ${response.status} ${response.statusText}`); }
        const text = await response.text();
        investimentos = text ? JSON.parse(text) : []; // Lida com resposta vazia
        atualizarTela();
    } catch (e) {
        alert("ERRO ao carregar dados do inventário: " + e.message);
        logout();
    }
}

function atualizarTela() {
    const totais = { luciano: 0, marcio: 0, kenedy: 0 };
    (investimentos || []).forEach(item => {
        const socio = item.Socio ? item.Socio.toLowerCase() : '';
        if (totais[socio] !== undefined) { totais[socio] += parseFloat(item.Valor) || 0; }
    });
    document.getElementById('total-luciano').textContent = formatarMoeda(totais.luciano);
    document.getElementById('total-marcio').textContent = formatarMoeda(totais.marcio);
    document.getElementById('total-kenedy').textContent = formatarMoeda(totais.kenedy);
}

function abrirFormularioAdicionar() {
    const form = document.getElementById('form-add-inventory');
    form.innerHTML = '<div class="form-group"><label>Sócio:</label><select id="inv-socio"><option value="Luciano">Luciano</option><option value="Marcio">Márcio</option><option value="Kenedy">Kenedy</option></select></div><div class="form-group"><label>Descrição:</label><input id="inv-desc" type="text" required></div><div class="form-group"><label>Valor (R$):</label><input id="inv-valor" type="number" step="0.01" required></div><button type="submit" class="btn-submit">Salvar</button>';
    document.getElementById('modal-add-inventory').showModal();
}

async function handleInventoryFormSubmit(e) {
    e.preventDefault();
    const data = {
        Data: new Date().toLocaleDateString("pt-BR"),
        Socio: document.getElementById('inv-socio').value,
        Descricao: document.getElementById('inv-desc').value,
        Valor: parseFloat(document.getElementById('inv-valor').value)
    };
    if (!data.Descricao || !data.Valor || data.Valor <= 0) { alert("Preencha todos os campos."); return; }
    showLoading('Salvando...');
    try {
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify({ action: 'addInventario', id_token: id_token, data: data })
        });
        if (!response.ok) { throw new Error(`Erro ao salvar: ${response.statusText}`); }
        setTimeout(async () => {
            await carregarDados();
            document.getElementById('modal-add-inventory').close();
            hideLoading();
        }, 1500);
    } catch (e) {
        alert("ERRO ao salvar o item: " + e.message);
        hideLoading();
    }
}

function abrirVisualizacaoInventario() {
    const body = document.getElementById('inventory-body');
    body.innerHTML = '';
    const porSocio = {};
    (investimentos || []).forEach(i => { (porSocio[i.Socio] = porSocio[i.Socio] || []).push(i); });
    for (const socio in porSocio) {
        if (porSocio[socio].length > 0) {
            let html = `<h3>${socio}</h3><table>`;
            porSocio[socio].forEach(item => { html += `<tr><td>${item.Descricao}</td><td>${formatarMoeda(item.Valor)}</td></tr>`; });
            body.innerHTML += html + '</table>';
        }
    }
    document.getElementById('modal-view-inventory').showModal();
}

function abrirModalReceitas() {
    alert('A funcionalidade de receitas será reativada em breve!');
}

async function inicializarAplicacao() {
    await carregarDados();
    hideLoading();
    document.getElementById('tela-principal').style.display = 'block';
    document.getElementById('btn-logout').addEventListener('click', logout);
    document.getElementById('btn-add-inventory').addEventListener('click', abrirFormularioAdicionar);
    document.getElementById('btn-view-inventory').addEventListener('click', abrirVisualizacaoInventario);
    document.getElementById('btn-view-recipes').addEventListener('click', abrirModalReceitas);
    document.getElementById('form-add-inventory').addEventListener('submit', handleInventoryFormSubmit);
    document.querySelectorAll('.btn-close').forEach(btn => btn.addEventListener('click', () => btn.closest('dialog').close()));
}

document.getElementById('logo-login').src = LOGO_URL;
document.getElementById('logo-principal').src = LOGO_URL;