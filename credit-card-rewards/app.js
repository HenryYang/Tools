const state = { data: null, cards: [], calcOptions: [] };

const $ = selector => document.querySelector(selector);
const escapeHtml = (value = "") => String(value).replace(/[&<>'"]/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[char]);
const fmt = new Intl.NumberFormat("zh-TW", { maximumFractionDigits: 4 });
const dateFmt = new Intl.DateTimeFormat("zh-TW", { year: "numeric", month: "short", day: "numeric" });

const labels = {
  category_bonus: "餐飲／購物／娛樂加碼", asia_dining_bonus: "精選國家實體餐飲加碼", autopay_bonus: "自動扣繳任務加碼", selected_base: "指定通路基本回饋", hsbc_live_autopay_source_cycle_eligible: "來源帳單期符合滙豐自動扣繳任務", general: "一般消費", overseas: "海外消費", domestic: "國內消費", no_reward: "無回饋",
  accelerated: "加速通路", automatic_accelerated: "自動倍速哩", registered_accelerated: "登錄倍速哩",
  inflight_preorder: "機上預購", base: "基本回饋", merchant_bonus: "特店加碼", channel_bonus: "通路加碼",
  payment_channel_bonus: "支付加碼", campaign_bonus: "活動加碼", half_up: "四捨五入", floor: "無條件捨去",
  ceil: "無條件進位", half_even: "銀行家取整", truncate: "截斷", unconfirmed: "待確認",
  billing_amount: "逐筆帳單金額", daily_eligible_amount: "每日合格消費合計", statement_eligible_amount: "每期帳單合格消費合計",
  calendar_month_eligible_amount: "每月合格消費合計", component_reward: "另一回饋項目的結果",
  verified: "已由官方資料確認", unverified: "仍有待確認項目", compositional: "回饋項目分別計算後加總",
  profile_based: "依條件選用單一回饋情境", round_components_then_sum: "各項取整後加總",
  highest_priority_error_on_tie: "優先序最高者生效；同分視為資料錯誤",
  switch_profile: "切換回饋情境", disable_component: "停用回饋項目", preserve_component: "保留回饋項目",
};
const label = value => friendly(value);

Object.assign(labels, {
 calendar_day:"每日",calendar_month:"每月",calendar_year:"每年",statement_cycle:"每期帳單",unlimited:"無上限",unknown:"官方未說明",
 excluded_transactions:"不回饋的消費",installment_exclusion:"分期不回饋",fees_taxes_exclusion:"費用與稅款排除",payment_channel_exclusion:"付款方式限制",
 minimum_points:"最低兌換點數",increment_points:"每次增加點數",maximum_points:"最高兌換點數",schedule:"兌換時間",fee:"兌換手續費",
 merchants:"指定商家",merchant_categories:"商家類別",merchant_categories_exclude:"不適用的商家類別",mcc:"商家行業代碼",mcc_ranges:"商家行業代碼範圍",
 merchant_countries:"交易國家",merchant_countries_exclude:"交易國家不是",merchant_registration_countries:"商家登記國家",merchant_registration_countries_exclude:"不適用的商家登記國家",
 payment_methods:"刷卡方式",payment_channels:"付款工具",currencies:"交易幣別",currencies_exclude:"交易幣別不是",billing_descriptor_contains:"帳單名稱包含",any_of:"符合以下任一條件",
 installment_types:"分期類型",installment_type:"分期類型",transaction_types:"交易類型",purchase_channels:"購買管道",purchase_types:"購買項目",interaction_modes:"交易方式",merchant_outlet_types:"門市類型",
 personal_conditions:"持卡人資格",electronic_statement_enabled:"已申辦電子帳單",issuer_account_autopay_successful:"銀行帳戶自動扣繳成功",reward_level_2_active:"符合第二級回饋資格",
 benefit_selected:"符合已選權益",benefit_plan:"權益方案",benefit_plans:"適用權益方案",foreign_transaction_fee_charged:"有收取國外交易服務費",
 match:"適用條件",calculation:"計算方式",requirements:"資格要求",instructions:"辦理說明",quota:"名額",type:"方式",unit:"單位",amount:"額度",period:"計算期間",scope:"合併計算範圍",metric:"額度計算項目",
 plans:"可選方案",options:"可選通路",max_active_options:"最多可選項目",change_frequency:"可更換頻率",change_limit:"更換次數限制",effective_rule:"生效方式",selection_period:"選擇期間",fallback:"未選擇時適用",default_plan:"預設方案",
 simple_choice:"簡單選",any_choice:"任意選",up_choice:"UP選",chill:"Chill刷",pay:"Pay著刷",daily:"天天刷",big_purchase:"大筆刷",dining:"好饗刷",digital:"數趣刷",travel:"玩旅刷",holiday:"假日刷",
 physical_card:"實體卡",card_number:"線上輸入卡號",apple_pay:"Apple Pay",google_pay:"Google Pay",samsung_pay:"Samsung Pay",garmin_pay:"Garmin Pay",
 direct:"直接刷卡",line_pay:"LINE Pay",plus_pay:"全盈＋PAY",jkopay:"街口支付",easy_wallet:"悠遊付",ipass_money:"iPASS MONEY",icash_pay:"icash Pay",alipay:"支付寶",esun_wallet_epayment:"玉山Wallet電子支付",taishin_pay:"台新Pay",taishin_pay_plus:"台新Pay＋",nccc_small_payment:"聯卡中心小額支付",px_pay:"PX Pay",pi_wallet:"Pi拍錢包",cpc_pay:"中油Pay",taiwan_pay:"台灣Pay",formosa_oil_pay:"台塑石油PAY",
 none:"非分期",merchant_installment:"特店分期",bank_installment:"銀行分期",statement_installment:"帳單分期",single_transaction_installment_zero_interest:"單筆零利率分期",single_transaction_installment_with_interest:"單筆有利率分期",
 card_present:"實體面對面交易",card_not_present:"線上或非面對面交易",official_website:"官方網站",official_app:"官方APP",onsite_counter:"現場櫃檯",ticket_machine:"售票機",pay_at_property:"到店付款",other:"其他",
 directly_operated_station:"直營加油站",standalone_store:"獨立門市",store_in_store:"店中店",online:"線上",
 restaurant:"餐飲",lodging:"住宿",department_store:"百貨",entertainment:"娛樂",ground_transport:"交通",convenience_store:"便利商店",ecommerce:"電商",duty_free:"免稅店",travel_agency:"旅行社",car_rental:"租車",stored_value:"儲值",
 general_purchase:"一般消費",refund:"退款",tax:"稅款",tuition:"學費",cash_advance:"預借現金",balance_transfer:"代償",utilities:"水電瓦斯",telecom_payment:"電信費",parking_fee:"停車費",stored_value_top_up:"儲值加值",insurance_autopay:"保費自動扣繳",insurance_lump_sum:"躉繳保費",insurance_investment_linked:"投資型保費",insurance_flexible:"彈性繳保費",national_health_insurance:"健保費",medical_fee:"醫療費",government_fee:"政府規費",traffic_fine:"罰鍰",fund_purchase:"基金購買",digital_asset:"虛擬資產",currency_exchange:"匯兌",gambling:"博弈",gambling_chips:"賭博籌碼",card_fee:"卡片費用",interest:"利息",
 eligible_spend:"符合加碼的消費金額",reward_amount:"回饋點數",incremental_reward_amount:"加碼回饋點數",user:"持卡人歸戶",card:"本卡",count:"次數",timezone:"時區",start:"開始日期",end:"結束日期",
 selected_level_2:"已選通路・第二級",selected_level_1:"已選通路・第一級",holiday_level_2:"假日消費・第二級",insurance_1_3:"保費回饋",chill_10:"Chill刷指定通路10%",chill_5:"Chill刷指定通路5%",pay_taishin_3_8:"台新Pay付款3.8%",pay_wallet_2_3:"指定電子支付2.3%",
 general_1_percent:"一般消費1%",general_0_3_percent:"一般消費0.3%",simple_choice_bonus:"簡單選加碼",any_choice_bonus:"任意選加碼",up_choice_bonus:"UP選加碼",domestic_bonus:"國內加碼",overseas_bonus:"海外加碼",eva_travel_bonus:"長榮旅遊加碼",
});
Object.assign(labels, {
 kind:"回饋類型",name:"名稱",amount_formula:"個人額度計算方式",personal_value:"個人永久信用額度",permanent_credit_limit:"永久信用額度",add_amount:"額外可加碼金額",amount_by_card:"各卡別額度",amount_selection:"多卡持有時的額度選擇",highest_tier_held_primary_card:"持有正卡中最高等級",allocation:"額度扣抵順序",transaction_date_then_id:"按交易日期先後",component_order:"回饋計算順序",reward_limit:"回饋上限",mode:"方式",profile:"適用回饋情境",component:"適用回饋項目",cap_groups:"共用上限",cap_overflow_profile:"超過上限後回饋",basis:"計算金額",rounding:"取整方式",precision:"小數位數",rate_percent:"回饋百分比",spend_per_point:"每點所需消費金額",value:"換算結果",currency:"幣別",approximate:"約略換算",formula:"換算方式",caveats:"注意事項",ids:"適用通路",options:"適用項目",option_eligibility:"通路選擇限制",eligible_options:"可選項目",all_options:"全部通路",selected_options:"已選通路",max_active_options:"可同時選擇項目數",up_subscription:"UP選訂閱",period_end_state_applies_to_period:"以當日最後方案計算全天消費",month_end_retroactive:"以月底最後方案計算整月消費",calendar_tags:"適用日期",tw_official_holiday:"臺灣官方例假日",card_networks:"信用卡組織",origin_countries:"出發國家",operating_carriers:"營運航空公司",route_types:"航線類型",service_providers:"服務業者",billing_currency:"帳單幣別",refund_rounding:"退款取整",point_pooling:"點數合併方式",redeemer:"可兌換人",untransferred_balance_expiry_months:"未轉換點數有效月數",
 booking_platform_accelerated:"訂房平台加速回饋",overseas_physical_accelerated:"海外實體加速回饋",wealth_overseas:"理財客戶海外回饋",wealth_domestic:"理財客戶國內回饋",cathay_taiwan_ticket:"臺灣出發國泰航空機票",fly_multiplier:"飛行加倍回饋",overseas_autopay:"海外消費・自動扣繳資格",kgi_wealth_management_3m_eligible:"符合理財客戶資格",cathay_fly_multiplier_eligible:"符合國泰飛行加倍資格",
 booking_platform_15:"訂房平台",overseas_physical_15:"海外實體",accelerated_reward:"指定通路回饋",general_reward:"一般消費回饋",travel_points:"旅遊積分",general_30:"一般消費",general_20:"一般消費",general_22:"一般消費",general_25:"一般消費",overseas_25:"海外消費",domestic_18:"國內消費",overseas_18:"海外消費",domestic_22:"國內消費",component:"回饋項目",profile:"回饋情境",
 fami_plus_pay:"全盈＋PAY",skm_pay:"skm pay",orange_pay:"橘子支付",open_wallet:"OPEN錢包",fami_pay:"FamiPay",my_fami_pay:"My FamiPay",gomaji_pay:"GOMAJI Pay",friday_wallet:"friDay錢包",ec_pay:"綠界支付",neweb_pay:"藍新支付",third_party_payment:"第三方支付",government_medical_payment_platform:"醫指付",fisc_bill_payment_platform:"電子化繳費稅平台",cht_bill_payment:"中華電信繳費平台",
 travellers_cheque:"旅行支票",unlicensed_investment:"境外投資平台",community_management_fee:"社區管理費",utility_autopay:"水電瓦斯代扣",telecom_autopay:"電信代扣",public_medical_fee:"公立醫療費用",etag_top_up:"eTag加值",installment_flexible_cash:"彈性現金分期",convenience_store_purchase:"超商消費",sogo_vip_lounge_purchase:"SOGO貴賓室消費",commercial_electricity:"營業用電",rent_collection:"租金代收",communication_loan:"通訊貸款",collection_payment:"代收款项",
 rail_pass:"交通周遊券",contactless_transit_entry:"感應進站",stored_value_product:"儲值商品",electronic_voucher:"電子票券",infant_formula:"嬰兒奶粉",medical_device:"醫療器材",medicine:"藥品",meal_voucher:"餐券",lodging_voucher:"住宿券",booking_service:"代訂服務",airline_ticket:"機票",travel_package:"旅遊行程",restaurant_order:"餐飲訂單",ride_hailing:"叫車",transit_card_top_up:"交通票卡加值",inflight_duty_free_onboard:"機上免稅購物",inflight_duty_free_preorder:"機上免稅預購",airport_store_purchase:"機場商店",airport_lounge:"機場貴賓室",customer_service_center:"客服中心",
 sum_daily_eligible_amounts_then_round_components_then_sum:"每日合格消費合計後，各項取整再加總",sum_eligible_amounts_then_round_components_then_sum:"合格消費合計後，各項取整再加總",
});
Object.assign(labels, {eligibility:"回饋資格",statement_reward_eligibility:"帳單回饋門檻",cardholding_lifetime:"持卡期間",fashion:"時尚族",mobile:"行動族",home:"居家族",jewellery:"珠寶精品",tv_shopping:"電視購物",car_maintenance:"汽車維護",insurance:"保險",book_store:"書店雜誌",hypermarket:"量販",home_furnishing:"家廚寢具",restaurant_venue_exclusion:"百貨／旅館內餐廳：不給族群加碼",overseas_physical_10:"海外實體加速回饋",registered_transit_6:"登錄交通通路加碼",primary_cardholder_id:"正卡持卡人",primary_cardholder:"正卡持卡人",component_id:"回饋項目",chill_merchants:"Chill刷指定商家",pay_channels:"Pay著刷指定支付",daily_merchants:"天天刷指定商家",big_purchase_merchants:"大筆刷指定商家",dining_merchants:"好饗刷指定商家",digital_merchants:"數趣刷指定商家",travel_merchants:"玩旅刷指定通路",holiday_spend:"假日消費",fly_multiplier_5:"飛行加倍回饋",fly_multiplier_10:"飛行加倍回饋",receipt_submission:"提交消費憑證",accelerated_10:"加速通路回饋",domestic_travel_agency:"國內旅行社",automatic_accelerated_10:"自動倍速哩",registered_accelerated_10:"登錄倍速哩",electronic_statement:"電子帳單",account_link:"銀行帳戶連結",component:"回饋項目",profile:"回饋情境"});
Object.assign(labels, {
 google_descriptor_conservative_exclusion: "Google 帳單交易：暫按不回饋處理（待確認）",
 convenience_exception_pay_level_2: "超商例外：台新Pay＋Pay著刷，第二級資格",
 convenience_exception_daily_level_2: "超商例外：台新Pay＋天天刷，第二級資格",
 convenience_exception_level_1: "超商例外：台新Pay＋Pay著刷或天天刷，第一級資格",
 taipei_metro_general_only: "臺北捷運：僅一般回饋",
 chill_marketplace_level_2_general_chill_rate: "Chill刷：外送與電商改按指定通路回饋",
 store_in_store_general_only: "店中店：僅一般回饋",
 specified_goods_general_only: "指定商品與購買方式：僅一般回饋",
});
labels.service_fee_rate = "服務費率";
labels.TWD = "新臺幣（TWD）";
const regions = new Intl.DisplayNames(["zh-TW"], {type:"region"});
function friendly(value) {
 if (value == null) return "官方未說明";
 if (typeof value === "boolean") return value ? "是" : "否";
 if (labels[value]) return labels[value];
 if (state.data?.display_names?.[value]) return state.data.display_names[value];
 if (/^[A-Z]{2}$/.test(String(value))) return regions.of(value);
 if (/[_]/.test(String(value))) return "其他指定條件（詳見官方說明）";
 return String(value);
}
function prose(value) {
 return String(value || "").replace(/end=null/g, "未設定到期日").replace(/fee保留null/g, "手續費官方未說明").replace(/cap-group/g, "共用回饋上限").replace(/unconfirmed/g, "待確認").replace(/null/g, "官方未說明").replace(/[a-z][a-z0-9]*(?:_[a-z0-9]+)+/g, token => friendly(token));
}
function titleFor(value, fallback) { return labels[value.id] || value.name || fallback; }


function provenanceOf(value) { return value?.provenance || {}; }
function verificationOf(value) { return provenanceOf(value).verification || {}; }
function validityOf(value) { return provenanceOf(value).validity || {}; }
function statusFor(card) {
  const validity = validityOf(card.document), today = state.data.as_of;
  if (validity.start && today < validity.start) return "upcoming";
  if (validity.end && today >= validity.end) return "expired";
  return "active";
}
function statusLabel(status) { return ({ active: "目前有效", upcoming: "尚未開始", expired: "已結束" })[status]; }
function dateRange(value) {
  const validity = validityOf(value);
  return `${validity.start || "未指定"} ～ ${validity.end ? `${validity.end}（不含）` : "持續有效"}`;
}
function verificationBadge(value) {
  const verification = verificationOf(value), status = verification.status || "unknown";
  return `<span class="verify ${escapeHtml(status)}">${escapeHtml(label(status))}</span>`;
}
function rateText(component) {
  if (component.rate_percent != null) return `${component.rate_percent}%`;
  if (component.spend_per_point != null) return `${component.spend_per_point} 元／點`;
  return "未設定比例";
}
function roundValue(value, mode) {
  if (mode === "floor" || mode === "truncate") return Math.floor(value);
  if (mode === "ceil") return Math.ceil(value);
  if (mode === "half_even") {
    const floor = Math.floor(value), fraction = value - floor;
    return fraction === .5 ? (floor % 2 === 0 ? floor : floor + 1) : Math.round(value);
  }
  return Math.round(value);
}
function calculationText(component) {
  const calculation = component.calculation || {}, rounding = calculation.rounding || {};
  const parts = [label(calculation.basis || "未設定")];
  if (calculation.period) parts.push(label(calculation.period));
  parts.push(label(rounding.mode || "未設定"));

  return parts.join(" · ");
}
function capIdsFrom(component) { return component.cap_groups || []; }
function cardCaps(card) { return new Map(card.cap_groups.map(entry => [entry.document.id, entry.document])); }
function capText(card, component) {
  const ids = capIdsFrom(component);
  if (!ids.length) return component.reward_limit?.mode === "unlimited" ? "無上限" : "上限未記錄";
  const caps = cardCaps(card);
  return ids.map(id => {
    const cap = caps.get(id);
    if (!cap) return "上限資料待補充";
    const amount = cap.amount != null ? `${fmt.format(cap.amount)} ${label(cap.unit)}` : cap.amount_by_card?.length ? "依卡別" : "金額待確認";
    return `${amount}／${label(cap.period)}`;
  }).join("；");
}

function renderScalar(value) {
  if (value === null) return '<span class="null">官方未說明</span>';
  if (typeof value === "boolean") return value ? "是" : "否";
  return escapeHtml(typeof value === "string" && /[\u4e00-\u9fff]/.test(value) ? prose(value) : friendly(value));
}
function renderStructured(value, depth = 0) {
  if (Array.isArray(value)) {
    if (!value.length) return '<span class="null">[]</span>';
    if (value.every(item => item == null || ["string", "number", "boolean"].includes(typeof item))) {
      return `<span>${value.map(renderScalar).join("、")}</span>`;
    }
    return `<div class="structured-list">${value.map((item, i) => `<div><b>${i + 1}</b>${renderStructured(item, depth + 1)}</div>`).join("")}</div>`;
  }
  if (value && typeof value === "object") {
    const entries = Object.entries(value).filter(([key]) => !["id","priority","schema_version","provenance","source_component","source_profile","source_stage"].includes(key));
    if (!entries.length) return '<span class="null">無額外條件</span>';
    return `<dl class="structured depth-${Math.min(depth, 3)}">${entries.map(([key, item]) => `<dt>${escapeHtml(labels[key] || "其他條件")}</dt><dd>${renderStructured(item, depth + 1)}</dd>`).join("")}</dl>`;
  }
  return renderScalar(value);
}
function renderProvenance(value) {
  const p = provenanceOf(value), v = p.verification || {};
  return `<div class="provenance">${verificationBadge(value)}<span>查核日 ${escapeHtml(v.checked_at || "未記錄")}</span>${v.note ? `<p>${escapeHtml(prose(v.note))}</p>` : ""}</div>`;
}
function sourceLinks(value) {
  const sources = provenanceOf(value).source || [];
  return sources.map((source, index) => {
    const ref = source.reference || "";
    if (/^https?:\/\//.test(ref)) return `<a href="${escapeHtml(ref)}" target="_blank" rel="noreferrer">官方來源 ${index + 1}</a>`;
    return `<span class="source-text">${escapeHtml(ref)}</span>`;
  }).join("") || '<span class="null">未記錄來源</span>';
}

function scenarios(card) {
  const doc = card.document;
  if (doc.reward_model === "profile_based") {
    const profiles = [...(doc.profiles || [])];
    if (card.issuer_id === "kgi_bank") profiles.sort((a, b) => Number(b.id === "general") - Number(a.id === "general"));
    return profiles.map(profile => ({
    id: profile.id, priority: profile.priority, match: profile.match || {}, components: profile.components || [], provenance: profile.provenance,
  }));
  }
  return (doc.components || []).map(component => ({
    id: component.id, priority: component.stacking?.priority || 0, match: component.match || {}, components: [component], provenance: component.provenance,
  }));
}
function componentRows(card, scenario) {
  return scenario.components.map(component => `<tr>
    <td>${escapeHtml(titleFor(component, label(component.kind) || "回饋"))}<br><small>${escapeHtml(label(component.kind))}</small></td>
    <td><strong>${escapeHtml(rateText(component))}</strong></td>
    <td>${escapeHtml(calculationText(component))}</td>
    <td>${escapeHtml(capText(card, component))}</td>
  </tr>`).join("");
}
function renderScenario(card, scenario) {
  return `<details class="subpanel scenario-panel">
    <summary><span>${escapeHtml(titleFor(scenario, "指定條件回饋"))}</span><span>${escapeHtml(scenario.components.map(rateText).join("＋"))}</span></summary>
    <div class="subpanel-body">
      ${renderProvenance(scenario)}
      <h5>適用條件</h5>${renderStructured(scenario.match)}
      <h5>回饋項目</h5>
      <div class="table-wrap"><table class="option-table"><thead><tr><th>項目</th><th>比例</th><th>計算方式</th><th>上限</th></tr></thead><tbody>${componentRows(card, scenario)}</tbody></table></div>
      ${scenario.components.map(component => {
        const requirements = component.requirements?.length ? `<h5>資格要求</h5>${renderStructured(component.requirements.map(item => ({id:item.id, type:item.type, instructions:item.instructions, quota:item.quota ?? null})))}` : "";
        return `<div class="component-detail">${escapeHtml(titleFor(component, label(component.kind) || "回饋"))}${renderProvenance(component)}${requirements}</div>`;
      }).join("")}
    </div>
  </details>`;
}
function renderRule(rule) {
  return `<details class="subpanel rule-panel"><summary><span>${escapeHtml(titleFor(rule, "消費限制與回饋調整"))}</span></summary><div class="subpanel-body">
    ${renderProvenance(rule)}<h5>符合條件時</h5>${renderStructured(rule.match || {})}<h5>套用效果</h5>${renderStructured(rule.effects || [])}
  </div></details>`;
}
function renderRules(card) {
  const rules = card.document.rules || [];
  if (!rules.length) return '<p class="null">未另列消費限制。</p>';
  if (rules.length === 1) return renderRule(rules[0]);
  return `<details class="subpanel rule-group"><summary>消費限制與回饋調整<span>${rules.length} 項說明</span></summary><div class="subpanel-body">${rules.map(rule => `<section class="rule-section"><h5>${escapeHtml(titleFor(rule, "消費限制"))}</h5>${renderProvenance(rule)}<h5>適用條件</h5>${renderStructured(rule.match || {})}<h5>回饋方式</h5>${renderStructured(rule.effects || [])}</section>`).join("")}</div></details>`;
}
function transferId(transfer) { return transfer.airline_program || transfer.hotel_program; }
function transferAmount(transfer) { return transfer.destination_points ?? transfer.destination_miles; }
function transferName(card, transfer) {
  const id = transferId(transfer);
  return card.reward_program.destination_names?.[id] || card.reward_program.airline_names[id] || id;
}
function renderTransfers(card) {
  const program = card.reward_program.document;
  const automatic = program.automatic_transfer ? [{...program.automatic_transfer, id: "automatic_transfer", mode: "自動"}] : [];
  const transfers = [...(program.transfers || []).map(item => ({...item, mode: "手動"})), ...automatic];
  if (!transfers.length) return '<p class="null">尚未收錄轉點規則；不代表不能轉點。</p>';
  return transfers.map(t => {
    const airline = transferName(card, t);
    return `<article class="transfer"><div><strong>${escapeHtml(airline)}</strong></div><p>${escapeHtml(t.source_points)} 點 → ${escapeHtml(transferAmount(t))} ${t.destination_unit === "point" ? "積分" : "哩"} · ${escapeHtml(t.mode)}</p>${renderStructured({minimum_points:t.minimum_points ?? null, increment_points:t.increment_points ?? null, maximum_points:t.maximum_points ?? null, schedule:t.timing_note || t.schedule || null, fee:t.fee_note || t.fee || "手續費暫按免費評估（官方未明載）"})}${renderProvenance(t)}</article>`;
  }).join("");
}
function renderCaps(card) {
  if (!card.cap_groups.length) return '<p class="null">未記錄額外回饋上限；請參考各回饋項目的上限說明。</p>';
  return card.cap_groups.map(entry => {
    const cap = entry.document;
    return `<details class="subpanel cap-panel"><summary><span>${escapeHtml(cap.name || "合併回饋上限")}</span></summary><div class="subpanel-body">${renderProvenance(cap)}${renderStructured(Object.fromEntries(Object.entries(cap).filter(([k]) => !["schema_version","kind","id","provenance"].includes(k))))}</div></details>`;
  }).join("");
}
function renderBenefit(card) {
  if (!card.benefit_program) return '<p class="null">此卡無須選擇權益方案。</p>';
  const entry = card.benefit_program, benefit = entry.document;
  return `<div class="linked-doc"><p><strong>${escapeHtml(benefit.name)}</strong></p>${renderProvenance(benefit)}
    <h5>方案設定</h5>${renderStructured({plans: benefit.plans || [], max_active_options: benefit.max_active_options, change_frequency: benefit.change_frequency, change_limit: benefit.change_limit || null, effective_rule: benefit.effective_rule, selection_period: benefit.selection_period, fallback: benefit.fallback, default_plan: benefit.default_plan || null})}
    <h5>可選項目（${benefit.options?.length || 0}）</h5><div class="benefit-options">${(benefit.options || []).map(option => `<details><summary>${escapeHtml(option.name || labels[option.id] || Object.values(option.match || {}).flat().filter(v => typeof v === "string").map(friendly).join("、") || "指定通路")}${verificationBadge(option)}</summary>${renderStructured(option.match || {})}${renderProvenance(option)}</details>`).join("")}</div>
    ${(benefit.notes || []).length ? `<h5>方案備註</h5><ul class="detail-list">${benefit.notes.map(note => `<li> ${escapeHtml(prose(note.text))}</li>`).join("")}</ul>` : ""}
  </div>`;
}
function renderCampaigns(card) {
  if (!card.campaigns.length) return '<p class="null">目前沒有另行收錄的期間活動。</p>';
  return card.campaigns.map(entry => {
    const campaign = entry.document;
    return `<details class="subpanel campaign-panel"><summary><span>${escapeHtml(campaign.name)}</span></summary><div class="subpanel-body">${renderProvenance(campaign)}${(campaign.components || []).map(component => `<h5>${escapeHtml(titleFor(component, "活動回饋"))} · ${escapeHtml(rateText(component))}</h5>${renderStructured({match:component.match || {}, calculation:component.calculation, cap_groups:component.cap_groups || [], requirements:component.requirements || []})}`).join("")}</div></details>`;
  }).join("");
}
function renderNotes(card) {
  const notes = card.document.notes || [];
  if (!notes.length) return '<p class="null">沒有備註。</p>';
  return `<ul class="detail-list full-notes">${notes.map(note => `<li><p>${escapeHtml(prose(note.text))}</p>${renderProvenance(note)}</li>`).join("")}</ul>`;
}
function metricTransferText(card, metric) {
  if (metric.transfer?.mode !== "manual") return "";
  const names = {cathay_membership_asia_miles: "亞萬", eva_infinity_mileagelands: "長榮", china_airlines_dynasty_flyer: "華航"};
  const transfers = (card.reward_program.document.transfers || []).filter(t => t.airline_program);
  const applicable = new Set(metric.transfer.ids || []);
  return `<details class="metric-transfers"><summary>可兌換：${transfers.map(t => escapeHtml(names[t.airline_program] || card.reward_program.airline_names[t.airline_program])).join("、")}</summary><div class="metric-transfer-content">${transfers.map(t => `<div class="metric-transfer-row"><span>${escapeHtml(names[t.airline_program] || card.reward_program.airline_names[t.airline_program])}</span><span>${escapeHtml(t.source_points)} 點 <span class="transfer-arrow">→</span> ${escapeHtml(transferAmount(t))} ${t.destination_unit === "point" ? "積分" : "哩"}</span>${applicable.has(t.id) ? '<small>適用上述成本</small>' : '<small>不同兌換比例</small>'}</div>`).join("")}</div></details>`;
}
function renderMetrics(card) {
  const metrics = card.document.derived_metrics || [];
  return metrics.map(metric => `<article class="metric-card"><div class="issuer">${escapeHtml(card.issuer_name)}</div><h3>${escapeHtml(card.name)}</h3><div class="metric-value">${new Intl.NumberFormat("zh-TW", {maximumFractionDigits: 2}).format(Number(metric.value))}<small> 元／哩</small></div><p class="metric-caption">${metric.approximate ? "約略換算成本" : "換算成本"}</p>${metricTransferText(card, metric)}<p class="installment-note"><span class="metric-section-label">分期回饋</span>${escapeHtml(metric.caveats?.[0] || "")}</p><details><summary>完整條件</summary>${renderStructured(metric)}</details></article>`).join("");
}

function renderSummary() {
  const counts = state.data.integrity.verification_counts;
  const active = state.cards.filter(card => statusFor(card) === "active").length;
  const issuers = new Set(state.cards.map(card => card.issuer_id)).size;
  $("#summary").innerHTML = [[active,"目前有效卡片"],[issuers,"發卡機構"],[counts.verified,"整卡已查證"],[counts.unverified,"含待確認項目"]].map(([value,title]) => `<div class="summary-item"><span>${title}</span><strong>${value}</strong></div>`).join("");
}
function renderMetricsBoard() {
  const html = state.cards.map(renderMetrics).join("");
  $("#metricGrid").innerHTML = html || '<div class="empty">目前沒有每哩成本資料。</div>';
}
function renderCard(card) {
  const doc = card.document, verification = verificationOf(doc), status = statusFor(card);
  const fee = doc.foreign_transaction_fee;
  const foreignFee = fee ? `<h4>國外交易服務費</h4>${renderStructured(Object.fromEntries(Object.entries(fee).map(([key, value]) => key === "rate_percent" ? ["service_fee_rate", `${value}%`] : [key, value])))}` : "";
  return `<details class="card-panel" data-card="${escapeHtml(card.id)}">
    <summary><div class="card-title"><small>${escapeHtml(card.issuer_name)}</small><strong>${escapeHtml(card.name)}</strong></div><span class="status ${status}">${statusLabel(status)}</span><span class="reward-glance">${scenarios(card).length} 個回饋情境 · ${(doc.rules || []).length} 條規則<br>${escapeHtml(card.reward_program.document.name)}</span><span class="chevron">＋</span></summary>
    <div class="card-body full-card-body"><div class="card-main">
      <div class="audit-strip">${verificationBadge(doc)}<span>查核日 ${escapeHtml(verification.checked_at || "未記錄")}</span></div>
      <h4>回饋情境與完整條件</h4>${scenarios(card).map(item => renderScenario(card,item)).join("")}
      <h4>消費限制與排除項目</h4>${renderRules(card)}
      <h4>回饋上限</h4>${renderCaps(card)}
      <h4>轉點規則</h4>${renderTransfers(card)}
      <h4>可選權益</h4>${renderBenefit(card)}
      <h4>期間活動</h4>${renderCampaigns(card)}
      ${foreignFee}
      <h4>全部備註</h4>${renderNotes(card)}
    </div><aside><h4>資料範圍</h4><ul class="detail-list"><li>有效期間：${escapeHtml(dateRange(doc))}</li><li>計算方式：${escapeHtml(label(doc.reward_model))}</li><li>取整方式：${escapeHtml(label(doc.aggregation))}</li><li>帳單幣別：${escapeHtml([doc.billing_currency || doc.billing_currency_options || "未指定"].flat().join("、"))}</li></ul><h4>官方來源</h4><div class="source-list">${sourceLinks(doc)}</div><h4>整卡查證說明</h4><p class="aside-note">${escapeHtml(prose(verification.note || "未記錄"))}</p></aside></div>
  </details>`;
}
function filterCards() {
  const query = $("#search").value.trim().toLowerCase(), issuer = $("#issuerFilter").value, activeOnly = $("#activeOnly").checked;
  const cards = state.cards.filter(card => {
    const haystack = `${card.name} ${card.issuer_name} ${card.id} ${card.reward_program.document.name}`.toLowerCase();
    return (!query || haystack.includes(query)) && (!issuer || card.issuer_id === issuer) && (!activeOnly || statusFor(card) === "active");
  });
  $("#cardList").innerHTML = cards.map(renderCard).join("");
  $("#catalogCount").textContent = `顯示 ${cards.length}／${state.cards.length} 張卡`;
  $("#emptyState").hidden = cards.length > 0;
}

function calcOptions(card) {
  const options = [];
  scenarios(card).forEach(scenario => scenario.components.forEach(component => {
    const calc = component.calculation || {}, rounding = calc.rounding || {};
    let disabledReason = null;
    if (calc.basis === "component_reward") disabledReason = "此項依賴另一回饋項目，不能單獨試算";
    else if (rounding.mode === "unconfirmed") disabledReason = "官方取整方式待確認";
    else if (component.rate_percent == null && component.spend_per_point == null) disabledReason = "沒有可試算比例";
    options.push({ scenario, component, disabledReason, compositional: card.document.reward_model === "compositional" });
  }));
  return options;
}
function populateControls() {
  const issuers = [...new Map(state.cards.map(card => [card.issuer_id,card.issuer_name])).entries()].sort((a,b) => a[1].localeCompare(b[1],"zh-Hant"));
  $("#issuerFilter").insertAdjacentHTML("beforeend", issuers.map(([id,name]) => `<option value="${escapeHtml(id)}">${escapeHtml(name)}</option>`).join(""));
  $("#calcCard").innerHTML = state.cards.filter(card => statusFor(card)==="active").map(card => `<option value="${escapeHtml(card.id)}">${escapeHtml(card.issuer_name)}｜${escapeHtml(card.name)}</option>`).join("");
  updateCalcOptions();
}
function updateCalcOptions() {
  const card = state.cards.find(item => item.id === $("#calcCard").value);
  $("#calcTransfers").open = false;
  state.calcOptions = card ? calcOptions(card) : [];
  $("#calcOption").innerHTML = state.calcOptions.map((item,index) => `<option value="${index}">${escapeHtml(titleFor(item.scenario, "指定条件回饋"))}｜${escapeHtml(titleFor(item.component, label(item.component.kind)))}｜${escapeHtml(rateText(item.component))}${item.disabledReason ? "（不可精確試算）" : ""}</option>`).join("");
  calculate();
}
function calculate() {
  const card = state.cards.find(item => item.id === $("#calcCard").value), option = state.calcOptions[Number($("#calcOption").value || 0)];
  if (!card || !option) return;
  const {component, disabledReason, compositional} = option, amount = Math.max(0, Number($("#calcAmount").value || 0));
  if (disabledReason) {
    $("#calcPrimary").textContent = "無法精確試算"; $("#calcSecondary").textContent = disabledReason;
    $("#calcTransfers").hidden = true; $("#calcTransferList").innerHTML = "";
  } else {
    const raw = component.rate_percent != null ? amount * Number(component.rate_percent) / 100 : amount / Number(component.spend_per_point);
    const points = roundValue(raw, component.calculation.rounding.mode);
    const transfers = [...(card.reward_program.document.transfers || []), ...(card.reward_program.document.automatic_transfer ? [card.reward_program.document.automatic_transfer] : [])];
    $("#calcPrimary").textContent = `${fmt.format(points)} 點`;
    $("#calcSecondary").textContent = "所選回饋項目的名目結果";
    $("#calcTransfers").hidden = transfers.length === 0;
    $("#calcTransferSummary").textContent = `查看航空／飯店換算 · ${transfers.length} 個計畫`;
    $("#calcTransferList").innerHTML = transfers.map(t => {
      const name = transferName(card, t);
      const value = new Intl.NumberFormat("zh-TW", {maximumFractionDigits:2}).format(points * transferAmount(t) / t.source_points);
      return `<div class="calc-transfer-item"><span>${escapeHtml(name)}</span><strong>約 ${value} ${t.destination_unit === "point" ? "積分" : "哩"}</strong></div>`;
    }).join("");
  }
  const warning = compositional ? "這是單一回饋項目 的結果；整卡總回饋須依疊加與覆寫規則計算" : "這是所選回饋情境 的名目結果；資格、上限與排除仍須另行判斷";
  $("#calcMeta").innerHTML = [calculationText(component), capText(card,component), warning].map(item => `<span class="pill">${escapeHtml(item)}</span>`).join("");
  $("#calcAmountLabel").textContent = component.calculation?.basis === "billing_amount" ? "單筆帳單金額（TWD）" : "該計算期間合格消費合計（TWD）";
}

function currentlyValid(value, day = state.data.as_of) {
  const validity = validityOf(value);
  return (!validity.start || day >= validity.start) && (!validity.end || day < validity.end);
}
function airlineGroups(cards = state.cards, activeOnly = true, query = "", category = "") {
  const groups = new Map();
  for (const card of [...cards, ...(cards === state.cards ? state.data.transfer_sources || [] : [])]) {
    const program = card.reward_program.document;
    const transfers = [...(program.transfers || []).map(t => ({...t, transferMode:"手動兌換"})),
      ...(program.automatic_transfer ? [{...program.automatic_transfer, transferMode:"自動轉入"}] : [])];
    for (const transfer of transfers) {
      if (activeOnly && ![card.document, program, transfer].every(value => currentlyValid(value))) continue;
      const id = transferId(transfer);
      const kind = transfer.hotel_program ? "hotel" : "airline";
      if (category && category !== kind) continue;
      const name = transferName(card, transfer);
      if (query && !name.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())) continue;
      if (!groups.has(id)) groups.set(id, {id, name, kind, alliance: kind === "hotel" ? "none" : state.data.airline_programs[id].document.alliance, entries:[]});
      groups.get(id).entries.push({card, program, transfer});
    }
  }
  return [...groups.values()].sort((a,b) => a.name.localeCompare(b.name,"zh-Hant"));
}
function transferRatio(transfer) {
  return `${fmt.format(transfer.source_points)} 點 → ${fmt.format(transferAmount(transfer))} ${transfer.destination_unit === "point" ? "積分" : "哩"}`;
}
function renderAirlineGroup(group) {
  const banks = new Set(group.entries.map(entry => entry.program.issuer));
  return `<details class="airline-panel"><summary><strong>${escapeHtml(group.name)}<small class="destination-kind">${group.kind === "hotel" ? "飯店積分" : "航空哩程／積分"}</small></strong><span>${banks.size} 個銀行 · ${group.entries.length} 項轉點選擇<span class="airline-chevron" aria-hidden="true">＋</span></span></summary>
    <div class="airline-entries">${group.entries.map(({card, program, transfer}) => {
      const active = [card.document, program, transfer].every(value => currentlyValid(value));
      return `<article class="airline-entry"><div class="airline-entry-heading"><div><small>${escapeHtml(card.issuer_name)}</small>${card.source_only ? `<strong>${escapeHtml(card.name)}</strong>` : `<a href="#card=${encodeURIComponent(card.id)}" class="airline-card-link">${escapeHtml(card.name)}</a>`}${card.source_only ? "" : `<p>${escapeHtml(program.name)}</p>`}</div><div class="airline-ratio"><strong>${escapeHtml(transferRatio(transfer))}</strong><small>${escapeHtml(transfer.transferMode)}${active ? "" : " · 非目前有效"}</small></div></div>
        <details class="airline-conditions"><summary>兌換條件</summary><div class="airline-conditions-body">${renderStructured({minimum_points:transfer.minimum_points ?? null, increment_points:transfer.increment_points ?? null, maximum_points:transfer.maximum_points ?? null, schedule:transfer.timing_note || transfer.schedule || null, fee:transfer.fee_note || transfer.fee || "手續費暫按免費評估（官方未明載）", redeemer:transfer.redeemer, point_pooling:transfer.point_pooling})}
        <p class="airline-validity">轉點期間：${escapeHtml(dateRange(transfer))}</p>${renderProvenance(transfer)}
        <p class="airline-validity">${card.source_only ? "" : `卡片期間：${escapeHtml(dateRange(card.document))}；`}點數計畫期間：${escapeHtml(dateRange(program))}</p>
        ${verificationBadge(card.document)} ${verificationBadge(program)}
        ${(program.notes || []).length ? `<h5>點數計畫補充說明</h5>${program.notes.map(n => `<p class="airline-validity">${escapeHtml(prose(n.text))}</p>`).join("")}` : ""}
        <div class="source-list">${sourceLinks(transfer)}</div></div></details>
      </article>`;
    }).join("")}</div></details>`;
}
const allianceOrder = [
  {id:"oneworld", name:"寰宇一家", english:"Oneworld"},
  {id:"star_alliance", name:"星空聯盟", english:"Star Alliance"},
  {id:"skyteam", name:"天合聯盟", english:"SkyTeam"},
  {id:"none", name:"其他航空與飯店", english:""},
];
function allianceSections(groups) {
  return allianceOrder.map(section => ({...section, groups:groups.filter(group => group.alliance === section.id).sort((a,b) => (a.kind === "hotel") - (b.kind === "hotel") || a.name.localeCompare(b.name,"zh-Hant"))})).filter(section => section.groups.length);
}
function renderAllianceSections(groups) {
  return allianceSections(groups).map(section => `<section class="alliance-section" aria-labelledby="alliance-${section.id}"><div class="alliance-heading"><h3 id="alliance-${section.id}">${section.name}${section.english ? `<small>${section.english}</small>` : ""}</h3><span>${section.groups.length} 個計畫</span></div><div class="alliance-programs">${section.groups.map(renderAirlineGroup).join("")}</div></section>`).join("");
}
function renderAirlines() {
  const groups = airlineGroups(state.cards, $("#airlineActiveOnly").checked, $("#airlineSearch").value, $("#destinationCategory").value);
  $("#airlineList").innerHTML = renderAllianceSections(groups);
  $("#airlineCount").textContent = `${groups.length} 個轉點計畫`;
  $("#airlineEmpty").hidden = groups.length > 0;
}
function selectView(view) {
  const airline = view === "airlines";
  $("#cardsView").hidden = airline; $("#airlinesView").hidden = !airline;
  for (const [id, selected] of [["cardsTab", !airline], ["airlinesTab", airline]]) {
    $(`#${id}`).setAttribute("aria-selected", String(selected));
    $(`#${id}`).tabIndex = selected ? 0 : -1;
  }
}
function applyViewRoute() {
  const hash = location.hash;
  selectView(hash === "#airlines" ? "airlines" : "cards");
  if (hash.startsWith("#card=")) {
    let id;
    try { id = decodeURIComponent(hash.slice(6)); } catch { return; }
    if (!state.cards.some(card => card.id === id)) return;
    $("#search").value = ""; $("#issuerFilter").value = ""; $("#activeOnly").checked = false;
    filterCards();
    const target = [...$("#cardList").querySelectorAll("[data-card]")].find(item => item.dataset.card === id);
    if (target) { target.open = true; target.scrollIntoView({block:"start"}); target.querySelector("summary").focus(); }
  }
}
function initializeViews() {
  renderAirlines(); applyViewRoute();
  for (const [id, route] of [["cardsTab", "cards"], ["airlinesTab", "airlines"]]) {
    $(`#${id}`).addEventListener("click", () => { location.hash = route; selectView(route); });
    $(`#${id}`).addEventListener("keydown", event => {
      if (!["ArrowLeft","ArrowRight","Home","End"].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === "Home" ? "cardsTab" : event.key === "End" ? "airlinesTab" : id === "cardsTab" ? "airlinesTab" : "cardsTab";
      $(`#${next}`).click(); $(`#${next}`).focus();
    });
  }
  ["#airlineSearch","#airlineActiveOnly","#destinationCategory"].forEach(selector => $(selector).addEventListener("input", renderAirlines));
  window.addEventListener("hashchange", applyViewRoute);
}

async function init() {
  try {
    state.data = window.REWARDS_DATA || await (await fetch("data.json", {cache:"no-store"})).json();
    state.cards = state.data.cards;
    if (state.data.integrity.card_count !== state.cards.length) throw new Error("網站資料完整性檢查失敗：卡片數不一致");
    $("#asOf").textContent = `資料日 ${dateFmt.format(new Date(`${state.data.as_of}T12:00:00`))}`;
    renderSummary(); renderMetricsBoard(); populateControls(); filterCards(); initializeViews();
    $("#calcCard").addEventListener("change", updateCalcOptions); $("#calcOption").addEventListener("change", calculate); $("#calcAmount").addEventListener("input", calculate);
    ["#search","#issuerFilter","#activeOnly"].forEach(selector => $(selector).addEventListener("input", filterCards));
  } catch (error) {
    document.querySelector("main").innerHTML = `<div class="empty"><h1>資料載入失敗</h1><p>${escapeHtml(error.message)}</p></div>`;
  }
}
init();
