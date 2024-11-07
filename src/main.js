import Datafeed from "./datafeed.js"

const storageKeys = {
    charts: "LocalStorageSaveLoadAdapter_charts",
    studyTemplates: "LocalStorageSaveLoadAdapter_studyTemplates",
    drawingTemplates: "LocalStorageSaveLoadAdapter_drawingTemplates",
    chartTemplates: "LocalStorageSaveLoadAdapter_chartTemplates",
    drawings: "LocalStorageSaveLoadAdapter_drawings"
}
  
class LocalStorageSaveLoadAdapter {
    _charts = []
    _studyTemplates = []
    _drawingTemplates = []
    _chartTemplates = []
    _isDirty = false
    _drawings = {}
  
    constructor() {
      this._charts = this._getFromLocalStorage(storageKeys.charts) ?? []
      this._studyTemplates =
        this._getFromLocalStorage(storageKeys.studyTemplates) ?? []
      this._drawingTemplates =
        this._getFromLocalStorage(storageKeys.drawingTemplates) ?? []
      this._chartTemplates =
        this._getFromLocalStorage(storageKeys.chartTemplates) ?? []
      this._drawings = this._getFromLocalStorage(storageKeys.drawings) ?? {}
      setInterval(() => {
        if (this._isDirty) {
          this._saveAllToLocalStorage()
          this._isDirty = false
        }
      }, 1000)
    }
  
    getAllCharts() {
      return Promise.resolve(this._charts)
    }
  
    removeChart(id) {
      for (var i = 0; i < this._charts.length; ++i) {
        if (this._charts[i].id === id) {
          this._charts.splice(i, 1)
          this._isDirty = true
          return Promise.resolve()
        }
      }
      return Promise.reject(new Error("The chart does not exist"))
    }
  
    saveChart(chartData) {
      if (!chartData.id) {
        chartData.id = this._generateUniqueChartId()
      } else {
        this.removeChart(chartData.id)
      }
      const savedChartData = {
        ...chartData,
        id: chartData.id,
        timestamp: Math.round(Date.now() / 1000)
      }
      this._charts.push(savedChartData)
      this._isDirty = true
      return Promise.resolve(savedChartData.id)
    }
  
    getChartContent(id) {
      for (var i = 0; i < this._charts.length; ++i) {
        if (this._charts[i].id === id) {
          return Promise.resolve(this._charts[i].content)
        }
      }
      return Promise.reject(new Error("The chart does not exist"))
    }
  
    removeStudyTemplate(studyTemplateData) {
      for (var i = 0; i < this._studyTemplates.length; ++i) {
        if (this._studyTemplates[i].name === studyTemplateData.name) {
          this._studyTemplates.splice(i, 1)
          this._isDirty = true
          return Promise.resolve()
        }
      }
      return Promise.reject(new Error("The study template does not exist"))
    }
  
    getStudyTemplateContent(studyTemplateData) {
      for (var i = 0; i < this._studyTemplates.length; ++i) {
        if (this._studyTemplates[i].name === studyTemplateData.name) {
          return Promise.resolve(this._studyTemplates[i].content)
        }
      }
      return Promise.reject(new Error("The study template does not exist"))
    }
  
    saveStudyTemplate(studyTemplateData) {
      for (var i = 0; i < this._studyTemplates.length; ++i) {
        if (this._studyTemplates[i].name === studyTemplateData.name) {
          this._studyTemplates.splice(i, 1)
          break
        }
      }
      this._studyTemplates.push(studyTemplateData)
      this._isDirty = true
      return Promise.resolve()
    }
  
    getAllStudyTemplates() {
      return Promise.resolve(this._studyTemplates)
    }
  
    removeDrawingTemplate(toolName, templateName) {
      for (var i = 0; i < this._drawingTemplates.length; ++i) {
        if (
          this._drawingTemplates[i].name === templateName &&
          this._drawingTemplates[i].toolName === toolName
        ) {
          this._drawingTemplates.splice(i, 1)
          this._isDirty = true
          return Promise.resolve()
        }
      }
      return Promise.reject(new Error("The drawing template does not exist"))
    }
  
    loadDrawingTemplate(toolName, templateName) {
      for (var i = 0; i < this._drawingTemplates.length; ++i) {
        if (
          this._drawingTemplates[i].name === templateName &&
          this._drawingTemplates[i].toolName === toolName
        ) {
          return Promise.resolve(this._drawingTemplates[i].content)
        }
      }
      return Promise.reject(new Error("The drawing template does not exist"))
    }
  
    saveDrawingTemplate(toolName, templateName, content) {
      for (var i = 0; i < this._drawingTemplates.length; ++i) {
        if (
          this._drawingTemplates[i].name === templateName &&
          this._drawingTemplates[i].toolName === toolName
        ) {
          this._drawingTemplates.splice(i, 1)
          break
        }
      }
      this._drawingTemplates.push({
        name: templateName,
        content: content,
        toolName: toolName
      })
      this._isDirty = true
      return Promise.resolve()
    }
  
    getDrawingTemplates() {
      return Promise.resolve(
        this._drawingTemplates.map(function(template) {
          return template.name
        })
      )
    }
  
    async getAllChartTemplates() {
      return this._chartTemplates.map(x => x.name)
    }
  
    async saveChartTemplate(templateName, content) {
      const theme = this._chartTemplates.find(x => x.name === templateName)
      if (theme) {
        theme.content = content
      } else {
        this._chartTemplates.push({ name: templateName, content })
      }
      this._isDirty = true
    }
  
    async removeChartTemplate(templateName) {
      this._chartTemplates = this._chartTemplates.filter(
        x => x.name !== templateName
      )
      this._isDirty = true
    }
  
    async getChartTemplateContent(templateName) {
      const content = this._chartTemplates.find(x => x.name === templateName)
        ?.content
      return {
        content: structuredClone(content)
      }
    }
  
    // Only used if `saveload_separate_drawings_storage` featureset is enabled
    async saveLineToolsAndGroups(layoutId, chartId, state) {
      const drawings = state.sources
      if (!drawings) return
  
      if (!this._drawings[this._getDrawingKey(layoutId, chartId)]) {
        this._drawings[this._getDrawingKey(layoutId, chartId)] = {}
      }
  
      for (let [key, state] of drawings) {
        if (state === null) {
          delete this._drawings[this._getDrawingKey(layoutId, chartId)][key]
        } else {
          this._drawings[this._getDrawingKey(layoutId, chartId)][key] = state
        }
      }
      this._isDirty = true
    }
  
    // Only used if `saveload_separate_drawings_storage` featureset is enabled
    async loadLineToolsAndGroups(
      layoutId,
      chartId,
      _requestType,
      _requestContext
    ) {
      if (!layoutId) {
        return null
      }
      const rawSources = this._drawings[this._getDrawingKey(layoutId, chartId)]
      if (!rawSources) return null
      const sources = new Map()
  
      for (let [key, state] of Object.entries(rawSources)) {
        sources.set(key, state)
      }
  
      return {
        sources
      }
    }
  
    _generateUniqueChartId() {
      const existingIds = this._charts.map(i => i.id)
      while (true) {
        const uid = Math.random()
          .toString(16)
          .slice(2)
        if (!existingIds.includes(uid)) {
          return uid
        }
      }
    }
  
    _getFromLocalStorage(key) {
      const dataFromStorage = window.localStorage.getItem(key)
      return JSON.parse(dataFromStorage || "null")
    }
  
    _saveToLocalStorage(key, data) {
      const dataString = JSON.stringify(data)
      window.localStorage.setItem(key, dataString)
    }
  
    _saveAllToLocalStorage() {
      this._saveToLocalStorage(storageKeys.charts, this._charts)
      this._saveToLocalStorage(storageKeys.studyTemplates, this._studyTemplates)
      this._saveToLocalStorage(
        storageKeys.drawingTemplates,
        this._drawingTemplates
      )
      this._saveToLocalStorage(storageKeys.chartTemplates, this._chartTemplates)
      this._saveToLocalStorage(storageKeys.drawings, this._drawings)
    }
  
    _getDrawingKey(layoutId, chartId) {
      return `${layoutId}/${chartId}`
    }
}

const isDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
const theme = isDark ? 'dark' : 'light';

var widget = window.tvWidget = new TradingView.widget({
	symbol: 'Bitfinex:ETH/USD',
	interval: '1D',
	fullscreen: true,
	container: 'tv_chart_container',
	autosize: true,
	datafeed: Datafeed,
	library_path: 'charting_library/',
	symbol_search_request_delay:1500,
	locale: "es",
	auto_save_delay: 9,
	save_load_adapter: new LocalStorageSaveLoadAdapter(),
	theme: theme,
	debug: false,
	charts_storage_url: 'https://saveload.tradingview.com',
	charts_storage_api_version: '1.1',
	client_id: 'stenox.ai',
	user_id: 'public_user_id',
});


widget.headerReady().then(() => {
	const themeToggleEl = widget.createButton({
		useTradingViewStyle: false,
		align: 'right',
	});
	themeToggleEl.dataset.internalAllowKeyboardNavigation = 'true';
	themeToggleEl.id = 'theme-toggle';
	themeToggleEl.innerHTML = `<label for="theme-switch" id="theme-switch-label">Dark/Light</label>
	<div class="switcher">
		<input type="checkbox" id="theme-switch" tabindex="-1">
		<span class="thumb-wrapper">
			<span class="track"></span>
			<span class="thumb"></span>
		</span>
	</div>`;
	themeToggleEl.title = 'Cambiar tema';
	const checkboxEl = themeToggleEl.querySelector('#theme-switch');
	checkboxEl.checked = theme === 'dark';
	checkboxEl.addEventListener('change', () => {
		const themeToSet = this.checked ? 'dark' : 'light'
		widget.changeTheme(themeToSet, { disableUndo: true });
	});
})
			