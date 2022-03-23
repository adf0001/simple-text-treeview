
// simple-text-treeview @ npm, simple text treeview.

var ui_model_treeview = require("ui-model-treeview");
var ele = require("get-element-by-id");
var ele_id = require("ele-id");
var dispatch_event_by_name = require("dispatch-event-by-name");

var htCss = require("htm-tool-css");	//require ht css

var simpleTextTreeviewClass = function (container) {
	this.init(container);
}

simpleTextTreeviewClass.prototype = {

	containerId: null,
	selectedName: null,		//the selected node name

	init: function (container) {
		container = ele(container);
		this.containerId = ele_id(container);

		container.onclick = this._onClick || (this._onClick = this.onClick.bind(this));
	},

	clickName: function (el) {
		dispatch_event_by_name.click(ui_model_treeview.nodeName(el));
	},
	clickToExpand: function (el) {
		dispatch_event_by_name.click(ui_model_treeview.nodeToExpand(el));
	},

	onClick: function (evt) {
		var el = evt.target;

		if (el.classList.contains("tree-name")) {
			if (this.selectedName) this.selectedName.classList.remove("selected");
			htCss.add(el, "selected");
			this.selectedName = el;
		}
		else if (el.classList.contains("tree-to-expand") && el.classList.contains("cmd")) {
			var elChildren = ui_model_treeview.nodeChildren(el.parentNode);
			if (elChildren && elChildren.hasChildNodes()) {
				var toShow = (elChildren.style.display == "none");

				ui_model_treeview.setToExpandState(el.parentNode, toShow ? false : true);
				elChildren.style.display = toShow ? "" : "none";

				if (!toShow && this.selectedName && elChildren.contains(this.selectedName)) {
					//un-select hidden node, and select current
					this.clickName(el.parentNode);
				}
			}
		}
	},
	_onClick: null,	//binding this

	formatContent: function (name, hasChildren) {
		var a = [];

		a[a.length] = "<span class='ht tree-to-expand" + (hasChildren ? " cmd" : " disabled") + "'" +
			" style='padding:0em 0.5em;text-decoration:none;font-family:monospace;font-size:9pt;cursor:default;'>" +
			(hasChildren ? "+" : ".") +
			"</span>";

		a[a.length] = "<span class='tree-name'>" + /*name +*/ "</span>";	//to avoid bad html format

		return a.join("");
	},

	//operation

	//add: function (elNode, text/textArray [, insert [, top]] )
	//return the first added node
	add: function (elNode, text, insert, top) {
		//arguments

		//node
		if (top) {
			if (!elNode || elNode.id != this.containerId) {
				console.log("invalid top node");
				return null;
			}
			insert = false;	//only append for top mode
		}
		else {
			elNode = ui_model_treeview.getNode(elNode || this.selectedName);
			if (!elNode) {
				console.log("invalid node");
				return null;
			}
		}

		//text is array
		if (text && (text instanceof Array)) {
			var i, imax = text.length, elFirst = null, el;
			for (i = 0; i < imax; i++) {
				el = this.add(elNode, text[i], insert, top);
				if (!el) {
					console.warn("add text array return null");
					return elFirst;
				}
				if (!elFirst) elFirst = el;
			}
			return elFirst;
		}

		if (typeof text !== "string") {
			console.log("invalid text", text);
			return null;
		}

		//add
		var el;
		if (insert) {
			//insert dom
			el = ui_model_treeview.addNode(elNode,
				{ contentHtml: this.formatContent(text), insert: insert }
			);
			ui_model_treeview.nodeName(el).innerHTML = text;
		}
		else {
			//append to children

			//expand existed
			if (!top && ui_model_treeview.getToExpandState(elNode) === true) {
				this.clickToExpand(elNode);
			}

			//append dom
			el = ui_model_treeview.addNode(elNode,
				{ contentHtml: this.formatContent(text) },
				top		//container for top
			);
			ui_model_treeview.nodeName(el).innerHTML = text;

			if (!top) {
				//children state
				ui_model_treeview.setToExpandState(elNode, false);		//set icon to '-'
				ui_model_treeview.nodeToExpand(elNode).classList.add("cmd");	//cursor & cmd
				ui_model_treeview.nodeChildren(elNode).style.display = "";	//expand hidden
			}
		}

		//select the new created
		this.clickName(el);

		return el;
	},

	insertNext: function (elNode, text) {
		elNode = ui_model_treeview.getNode(elNode || this.selectedName);
		if (!elNode) {
			console.log("invalid node");
			return null;
		}

		if (elNode.nextSibling) return this.add(elNode.nextSibling, text, true);
		else return this.add(elNode.parentNode, text, false, elNode.parentNode.id == this.containerId);
	},

	remove: function (elNode) {
		elNode = ui_model_treeview.getNode(elNode || this.selectedName);
		if (!elNode) {
			console.log("invalid node");
			return;
		}

		//prepare next selected
		var elSelect = elNode.nextSibling || elNode.previousSibling;
		var elParent = elSelect ? null : elNode.parentNode;
		var isTop = elParent && elParent.id == this.containerId;

		//remove dom
		elNode.parentNode.removeChild(elNode);

		//select next
		if (elSelect) this.clickName(elSelect);
		else {
			if (!isTop) {
				elParent = ui_model_treeview.getNode(elParent);

				this.clickName(elParent);

				//children state
				ui_model_treeview.setToExpandState(elParent, "disable");
				ui_model_treeview.nodeToExpand(elParent).classList.remove("cmd");
				ui_model_treeview.nodeChildren(elParent).style.display = "none";
			}
			else {
				this.selectedName = null;	//top data empty
			}
		}

	},

	update: function (elNode, text) {
		//arguments
		if (typeof text !== "string") {
			console.log("invalid data", text);
			return null;
		}

		elNode = ui_model_treeview.getNode(elNode || this.selectedName);
		if (!elNode) {
			console.log("invalid node");
			return;
		}

		//update
		ui_model_treeview.nodeName(elNode).innerHTML = text;

		this.clickName(elNode);
	},

};

//module

exports.class = simpleTextTreeviewClass
