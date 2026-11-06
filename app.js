const STORAGE_KEY = 'counter-pos-v1';
const seedProducts = [
  {id:'p1',name:'Bottled water',category:'Drinks',price:1,stock:48,emoji:'💧'},
  {id:'p2',name:'Fizzy drink',category:'Drinks',price:1.5,stock:36,emoji:'🥤'},
  {id:'p3',name:'Lager beer',category:'Drinks',price:2.5,stock:24,emoji:'🍺'},
  {id:'p4',name:'Cider',category:'Drinks',price:2.75,stock:18,emoji:'🍏'},
  {id:'p5',name:'Chips',category:'Food',price:2,stock:15,emoji:'🍟'},
  {id:'p6',name:'Beef burger',category:'Food',price:6,stock:12,emoji:'🍔'},
  {id:'p7',name:'Peanuts',category:'Groceries',price:1.25,stock:22,emoji:'🥜'},
  {id:'p8',name:'Cooking oil 1L',category:'Groceries',price:4.5,stock:8,emoji:'🫙'}
];
let state = loadState();
let cart = [];
let activeCategory = 'All items';
let searchTerm = '';
let toastTimer;
const $ = (selector) => document.querySelector(selector);
const money = (amount) => `$${Number(amount).toFixed(2)}`;
function loadState(){
  try { const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)); if(saved && Array.isArray(saved.products) && Array.isArray(saved.orders)) return saved; }
  catch(error) { console.warn('Could not read saved POS data',error); }
  return {products:seedProducts,orders:[]};
}
function saveState(){ try { localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); } catch(error) { showToast('Could not save data on this device.'); } }
function setView(name){
  document.querySelectorAll('.view').forEach(el=>el.classList.toggle('active',el.id===`${name}-view`));
  document.querySelectorAll('.nav-link').forEach(el=>el.classList.toggle('active',el.dataset.view===name));
  $('#page-title').textContent={pos:'Point of sale',orders:'Orders',inventory:'Products'}[name];
  if(name==='orders') renderOrders(); if(name==='inventory') renderInventory();
}
function renderCategories(){
  const categories=['All items',...new Set(state.products.map(product=>product.category))];
  if(!categories.includes(activeCategory)) activeCategory='All items';
  $('#categories').innerHTML=categories.map(category=>`<button class="category-button ${category===activeCategory?'active':''}" data-category="${escapeHTML(category)}">${escapeHTML(category)}</button>`).join('');
  $('#categories').querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>{activeCategory=button.dataset.category;renderCatalog()}));
}
function renderCatalog(){
  renderCategories();
  const products=state.products.filter(product=>(activeCategory==='All items'||product.category===activeCategory)&&product.name.toLowerCase().includes(searchTerm.toLowerCase()));
  $('#product-grid').innerHTML=products.length?products.map(product=>`<button class="product-card" data-product="${escapeHTML(product.id)}" ${product.stock<1?'disabled':''} aria-label="Add ${escapeHTML(product.name)} to order"><span class="product-art">${escapeHTML(product.emoji||'🛍️')}</span><span class="product-name">${escapeHTML(product.name)}</span><span class="product-category">${escapeHTML(product.category)}</span><span class="product-card-bottom"><span class="product-price">${money(product.price)}</span><span class="stock-label ${product.stock<=5?'low':''}">${product.stock} left</span></span></button>`).join(''):'<div class="no-products">No products match your search.</div>';
  $('#product-grid').querySelectorAll('[data-product]').forEach(button=>button.addEventListener('click',()=>addToCart(button.dataset.product)));
}
function addToCart(id){
  const product=state.products.find(item=>item.id===id); if(!product||product.stock<1)return;
  const existing=cart.find(item=>item.id===id); const quantity=existing?existing.quantity:0;
  if(quantity>=product.stock){showToast('No more stock available for this item.');return;}
  existing?existing.quantity++:cart.push({id,quantity:1});renderCart();
}
function updateQuantity(id,change){
  const item=cart.find(row=>row.id===id);const product=state.products.find(row=>row.id===id);if(!item||!product)return;
  item.quantity+=change;if(item.quantity<1)cart=cart.filter(row=>row.id!==id);else if(item.quantity>product.stock){item.quantity=product.stock;showToast('Quantity limited to available stock.');}renderCart();
}
function cartTotal(){return cart.reduce((total,item)=>{const product=state.products.find(row=>row.id===item.id);return total+(product?product.price*item.quantity:0)},0)}
function renderCart(){
  const quantity=cart.reduce((sum,item)=>sum+item.quantity,0);$('#cart-item-count').textContent=quantity;$('#subtotal').textContent=money(cartTotal());$('#total').textContent=money(cartTotal());$('#checkout-button').disabled=!quantity;
  if(!quantity){$('#cart-items').innerHTML='<div class="empty-cart"><div class="empty-icon">＋</div><b>Nothing here yet</b><span>Tap a product to get started.</span></div>';return;}
  $('#cart-items').innerHTML=cart.map(item=>{const product=state.products.find(row=>row.id===item.id);if(!product)return '';return `<div class="cart-row"><div><div class="cart-row-title">${escapeHTML(product.name)}</div><div class="cart-row-meta">${money(product.price)} each</div><div class="quantity-control"><button data-qty="-1" data-id="${escapeHTML(item.id)}" aria-label="Decrease ${escapeHTML(product.name)} quantity">−</button><span>${item.quantity}</span><button data-qty="1" data-id="${escapeHTML(item.id)}" aria-label="Increase ${escapeHTML(product.name)} quantity">+</button></div></div><div class="cart-row-price">${money(product.price*item.quantity)}</div></div>`}).join('');
  $('#cart-items').querySelectorAll('[data-qty]').forEach(button=>button.addEventListener('click',()=>updateQuantity(button.dataset.id,Number(button.dataset.qty))));
}
function renderOrders(){
  $('#order-count').textContent=state.orders.length;
  $('#empty-orders').style.display=state.orders.length?'none':'flex';
  $('#orders-body').innerHTML=[...state.orders].reverse().map(order=>`<tr><td class="order-id">${escapeHTML(order.id)}</td><td>${escapeHTML(new Date(order.createdAt).toLocaleString())}</td><td>${order.items.reduce((sum,item)=>sum+item.quantity,0)}</td><td>${escapeHTML(order.payment)}</td><td><span class="status ${order.status.toLowerCase()}">${escapeHTML(order.status)}</span></td><td class="align-right"><b>${money(order.total)}</b></td></tr>`).join('');
}
function renderInventory(){
  $('#empty-inventory').hidden=state.products.length>0;
  $('#inventory-body').innerHTML=state.products.map(product=>`<tr><td class="order-id">${escapeHTML(product.emoji||'🛍️')} &nbsp;${escapeHTML(product.name)}</td><td>${escapeHTML(product.category)}</td><td>${money(product.price)}</td><td class="${product.stock<=5?'low-stock':''}">${product.stock}</td><td class="align-right"><button class="inventory-remove" data-remove="${escapeHTML(product.id)}">Remove</button></td></tr>`).join('');
  $('#inventory-body').querySelectorAll('[data-remove]').forEach(button=>button.addEventListener('click',()=>removeProduct(button.dataset.remove)));
}
function escapeHTML(value){return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));}
function showToast(message){const toast=$('#toast');toast.textContent=message;toast.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove('show'),2500)}
function openDialog(dialog){if(typeof dialog.showModal==='function')dialog.showModal();else dialog.setAttribute('open','')}
function closeDialog(dialog){if(typeof dialog.close==='function')dialog.close();else dialog.removeAttribute('open')}
function updateCheckoutButton(){const method=$('input[name="payment"]:checked').value;$('#place-order').innerHTML=method==='Cash'?'Record cash sale <span>→</span>':`Create pending ${escapeHTML(method)} order <span>→</span>`;}
function placeOrder(event){
  event.preventDefault();if(!cart.length)return;
  const method=$('input[name="payment"]:checked').value;
  const items=cart.map(item=>{const product=state.products.find(row=>row.id===item.id);return {id:item.id,name:product.name,price:product.price,quantity:item.quantity}});
  const total=Number(cartTotal().toFixed(2));const order={id:`ORD-${Date.now().toString().slice(-7)}`,createdAt:new Date().toISOString(),items,total,payment:method,status:method==='Cash'?'Paid':'Pending'};
  if(method==='Cash'){
    items.forEach(item=>{const product=state.products.find(row=>row.id===item.id);if(product)product.stock=Math.max(0,product.stock-item.quantity)});
  }
  state.orders.push(order);saveState();cart=[];renderCart();renderCatalog();renderOrders();closeDialog($('#checkout-dialog'));$('#customer-name').value='';
  $('#message-mark').classList.toggle('pending-mark',method!=='Cash');$('#message-mark').textContent=method==='Cash'?'✓':'!';
  $('#message-kicker').textContent=method==='Cash'?'ORDER SAVED':'PAYMENT PENDING';
  $('#message-title').textContent=method==='Cash'?'Sale recorded':`${method} integration needed`;
  $('#message-body').textContent=method==='Cash'?`Order ${order.id} was recorded as paid in cash.`:`Order ${order.id} is saved as pending. This demo does not contact ${method} or collect payment. Connect a verified provider API and backend before accepting live payments.`;
  $('#message-total').textContent=money(total);openDialog($('#message-dialog'));
}
function removeProduct(id){if(cart.some(item=>item.id===id)){showToast('Remove this item from the current order first.');return;}state.products=state.products.filter(item=>item.id!==id);saveState();renderInventory();renderCatalog();showToast('Product removed.');}
function addProduct(event){event.preventDefault();const name=$('#product-name').value.trim(),price=Number($('#product-price').value),stock=Math.floor(Number($('#product-stock').value));if(!name||!Number.isFinite(price)||price<=0||!Number.isFinite(stock)||stock<0)return;const category=$('#product-category').value;const icons={Drinks:'🥤',Food:'🍽️',Groceries:'🛍️',Other:'📦'};state.products.push({id:`p-${Date.now()}`,name,category,price:Number(price.toFixed(2)),stock,emoji:icons[category]||'📦'});saveState();renderCatalog();renderInventory();event.target.reset();$('#product-stock').value=20;closeDialog($('#product-dialog'));showToast('Product added to your catalog.');}
function exportOrders(){if(!state.orders.length){showToast('There are no orders to export yet.');return;}const rows=[['Order ID','Date','Items','Payment','Status','Total'],...state.orders.map(order=>[order.id,order.createdAt,order.items.map(item=>`${item.name} x${item.quantity}`).join('; '),order.payment,order.status,order.total.toFixed(2)])];const csv=rows.map(row=>row.map(cell=>`"${String(cell).replaceAll('"','""')}"`).join(',')).join('\n');const link=document.createElement('a');link.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));link.download='counter-orders.csv';link.click();URL.revokeObjectURL(link.href);}
document.querySelectorAll('.nav-link').forEach(button=>button.addEventListener('click',()=>setView(button.dataset.view)));
document.querySelectorAll('[data-open-product]').forEach(button=>button.addEventListener('click',()=>openDialog($('#product-dialog'))));
document.querySelectorAll('[data-close]').forEach(button=>button.addEventListener('click',()=>closeDialog(button.closest('dialog'))));
$('#search-input').addEventListener('input',event=>{searchTerm=event.target.value;renderCatalog()});$('#clear-cart').addEventListener('click',()=>{cart=[];renderCart()});$('#checkout-button').addEventListener('click',()=>{if(cart.length){$('#dialog-total').textContent=money(cartTotal());openDialog($('#checkout-dialog'))}});
document.querySelectorAll('input[name="payment"]').forEach(input=>input.addEventListener('change',updateCheckoutButton));$('#checkout-form').addEventListener('submit',placeOrder);$('#product-form').addEventListener('submit',addProduct);$('#export-orders').addEventListener('click',exportOrders);
$('#help-button').addEventListener('click',()=>{ $('#message-mark').classList.remove('pending-mark');$('#message-mark').textContent='i';$('#message-kicker').textContent='ABOUT THIS APP';$('#message-title').textContent='A local-first POS starter';$('#message-body').textContent='Products and orders are saved in this browser on this device. Cash sales can be recorded here. EcoCash, M-Pesa, C Pay, Khetsi, and bank card options are payment placeholders until real provider APIs are configured on a secure backend.';$('#message-total').textContent='';openDialog($('#message-dialog'));});
document.addEventListener('keydown',event=>{if(event.key==='/'&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)&&!$('#checkout-dialog').open&&!$('#product-dialog').open){event.preventDefault();$('#search-input').focus()} });
$('#today-label').textContent=new Intl.DateTimeFormat(undefined,{weekday:'long',month:'short',day:'numeric'}).format(new Date()).toUpperCase();
renderCatalog();renderCart();renderOrders();updateCheckoutButton();
