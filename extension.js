import { Extension, gettext as _ } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import Gio from 'gi://Gio';
import St from 'gi://St';
import Clutter from 'gi://Clutter';

import * as Config from 'resource:///org/gnome/shell/misc/config.js';

export default class HideItems extends Extension {
    constructor(ext) {
        super(ext);
    }

    enable() {
        this.settings = this.getSettings();
        this.settings.connect("changed::hideiconstate", this._changeState.bind(this))
        this.settings.connect("changed::nothiddenindicator", this._settingsHiddenIndicatorStateChange.bind(this))
        this.settings.connect("changed::topbarupdater", this._updateIcon.bind(this))

        console.log("Hide Items Extension started...");
        this._indicator = null;

        this._menu = null;

        //default visibility is true, but in the future i prepare it to state management
        this._settingsJSON = this._importJSONFile();
        this._visibility = this._setVisibiltyState();

        this._iconRank = 0;

        this._createButton()
        this._setIconVisibility();


        //Update if a new button added or old removed from the panel
        const shellVersion = parseFloat(Config.PACKAGE_VERSION).toString().slice(0, 2);
        console.log(shellVersion)
        let signalName = (shellVersion == 45) ? 'actor' : /* 46 */ 'child';
        this._connectAddedHandlerID = Main.panel._rightBox.connect(signalName + "-added", this._addedIconListener.bind(this));
        this._connectRemovedHandlerID = Main.panel._rightBox.connect(signalName + "-removed", this._removedIconListener.bind(this));
    }

    disable() {
        console.log("Hide Items Extension stopped...");
        Main.panel._rightBox.disconnect(this._connectAddedHandlerID);
        Main.panel._rightBox.disconnect(this._connectRemovedHandlerID);
        this._changeBackVisibility();

        this._menu?.destroy();
        this._menu = null;

        this._showIcon?.destroy();
        this._showIcon = null;
        this._hideIcon?.destroy();
        this._hideIcon = null;
        this._indicator?.destroy();
        this._indicator = null;

        this._settingsJSON = null;
        this._visibility = null;
        this._iconRank = null;
        this._connectAddedHandlerID = null;
        this._connectRemovedHandlerID = null;

        this.settings = null;
    }

    _addMenu() {
        this._menu = new PopupMenu.PopupMenuItem('Settings', {

        });
        this._menu.connect('activate', () => {
            try {
                // this.#extension.openPreferences()
                // Itt tudod elhelyezni a jobb gombhoz tartozó műveletet
                //console.log("Jobb gombra kattintva - Menü aktiválva");
                this.openPreferences();
            } catch (e) {
                console.log('error', e);
            }
        });
        this._indicator.menu.addMenuItem(this._menu);
    }

    //call when disabled()
    _changeBackVisibility() {
        var rightBoxItems = Main.panel._rightBox.get_children();
        rightBoxItems.forEach((item, index) => {
            item.visible = true
        })
    }

    _createButton() {
        //icon size
        this._iconSize = 16;

        const showAdwIcon = Gio.icon_new_for_string(`${this.path}/icons/left-symbolic.svg`);
        this._showIcon = this._createIcon(showAdwIcon);

        const hideAdwIcon = Gio.icon_new_for_string(`${this.path}/icons/right-symbolic.svg`);
        this._hideIcon = this._createIcon(hideAdwIcon);

        this._indicator = new PanelMenu.Button(0.0, this.metadata.name, false);
        this._indicator.connect('button-press-event', this._buttonClicked.bind(this));

        this._setButtonIcon();
        this._iconRank = this._getSettingsRank();


        Main.panel.addToStatusArea(this.uuid, this._indicator, this._iconRank, "right");

        this._addMenu()
    }

    _createIcon(icon) {
        return new St.Icon({
            gicon: icon,
            style_class: 'system-status-icon',
            icon_size: this._iconSize
        });
    }

    _setButtonIcon() {
        try {
            if (this._indicator.first_child !== null) {
                this._indicator.remove_child(this._indicator.first_child)
            }
            if (this._visibility) {
                this._indicator.add_child(this._showIcon)
            } else {
                this._indicator.add_child(this._hideIcon)
            }
        } catch (e) {
            console.log("HideItems error: ", e)
        }
    }

    _getSettingsRank() {
        var rightBoxItems = Main.panel._rightBox.get_children();
        var rank = null;
        rightBoxItems.map((item, index) => {
            if (item === Main.panel.statusArea.quickSettings.get_parent()) {
                rank = index;
            }
        })
        //console.log("index: ", rank)
        return rank;
    }

    //CLICKED BUTTON
    _buttonClicked(actor, event) {
        if (event.get_button() === Clutter.BUTTON_PRIMARY) {
            // Bal egérgomb lenyomva
            //console.log('Bal egérgomb lenyomva');
            this._visibility = !this._visibility;
            this._changeVisibilityState();
            this._hideOrShowItems();
            this._changeIcon();
            this._indicator.menu.toggle();
        } else if (event.get_button() === Clutter.BUTTON_SECONDARY) {
            //console.log('Jobb egérgomb lenyomva');
        }


    }

    _changeIcon() {
        this._setButtonIcon();
    }

    _hideOrShowItems() {
        var rightBoxItems = Main.panel._rightBox.get_children();
        rightBoxItems.map((item, index) => {
            if (item.child !== Main.panel.statusArea.quickSettings && item.child !== this._indicator && this._isVisibleChildrenInIt(item.child)) {
                item.visible = this._visibility;
            }
        })
    }

    _isVisibleChildrenInIt(item){
        var boolean = true;
        var childrenName = null;
        if(item.accessible_name !== ""){
            childrenName = item.accessible_name;
        }else{
            childrenName = item.constructor.$gtype.name
        }
        this._settingsJSON.visibleChildren.map((item,index)=>{
            item == childrenName ? boolean = false : null;
        })

        return boolean;
    }

    _setIconVisibility() {
        this._visibility ?
            null
            :
            this._hideOrShowItems();
        this._changeIcon();
    }

    //LISTENER
    _addedIconListener(container, actor) {
        this._hideOrShowItems();
        //change the icon index
        this._sendItemsToPrefs(this._getEveryChildrenFrom_RightBox())
    }

    _removedIconListener(container, actor) {
        this._sendItemsToPrefs(this._getEveryChildrenFrom_RightBox())
    }

    _updateIcon(){
        this._sendItemsToPrefs(this._getEveryChildrenFrom_RightBox())
    }

    //state management
    _importJSONFile() {
        let settingsJSONpath = `${this.path}/settings.json`
        try {
            let file = Gio.File.new_for_path(settingsJSONpath);
            let [success, content] = file.load_contents(null);

            if (success) {
                let json = JSON.parse(content);
                return json;
            } else {
                return null;
            }
        } catch (error) {
            //console.log('Hiba történt:', error.message);
            return null;
        }
    }

    _updateJSONFile(newState, newVisibility) {
        let settingsJSONpath = `${this.path}/settings.json`
        try {
            let file = Gio.File.new_for_path(settingsJSONpath);
            let [success, content] = file.load_contents(null);

            if (success) {
                let json = JSON.parse(content);

                // Frissítsd a "position" kulcs értékét az új pozícióval
                json.state = newState;
                json.visibility = newVisibility;

                // JSON objektumot szöveggé alakítsuk
                let updatedContent = JSON.stringify(json, null, 4);

                // A fájl tartalmának frissítése
                file.replace_contents(
                    updatedContent,
                    null,
                    false,
                    Gio.FileCreateFlags.REPLACE_DESTINATION,
                    null
                );
            } else {
            }
        } catch (error) {
            console.log('Something wrong happened:', error.message);
        }
    }

    _setVisibiltyState() {
        if (this._settingsJSON.state === "1") {
            return this._settingsJSON.visibility;
        } else {
            return this._settingsJSON.defaultVisibility;
        }
    }

    _changeVisibilityState() {
        if (this._settingsJSON.state === "1") {
            this._updateJSONFile(this._settingsJSON.state, this._visibility);
        }
    }

    //gsettings change
    _changeState() {
        //this._updateJSONFile()
        //console.log("this.settings")
        this._updateJSONFile(this.settings.get_string("hideiconstate"), this._visibility);
        this._settingsJSON = this._importJSONFile();
    }

    //icon index change EXPERIMENTAL!!!
    _changeIndicatorIndex() {
        //Main.panel.statusArea.quickSettings 
        var settingsRank = this._getSettingsRank();
        var indicatorRank = this._getIndicatorRank();

        if (settingsRank !== indicatorRank) {
            this._showIcon?.destroy();
            this._showIcon = null;
            this._hideIcon?.destroy();
            this._hideIcon = null;
            this._indicator?.destroy();
            this._indicator = null;
            this._createButton()
        }
    }

    _getIndicatorRank() {
        var rightBoxItems = Main.panel._rightBox.get_children();
        var rank = null;
        rightBoxItems.map((item, index) => {
            if (item.get_first_child().accessible_name == "Hide Items") {
                rank = index;
            }
        })
        //console.log("index: ", rank)
        return rank;
    }

    //changeHiddenIcons
    _getEveryChildrenFrom_RightBox(){
        var rightBoxItems = Main.panel._rightBox.get_children();
        var childrenNames = [];
        rightBoxItems.map((item, index) => {
            if (item.get_first_child() !== Main.panel.statusArea.quickSettings && item.get_first_child().accessible_name !== "Hide Items") {
                if(item.get_first_child().accessible_name !== ""){
                    childrenNames.push(item.get_first_child().accessible_name);
                }else{
                    childrenNames.push(item.get_first_child().constructor.$gtype.name);
                }
            }
        })
        console.log(childrenNames);
        return childrenNames;
    }

    _sendItemsToPrefs(childrenNames){
        this.settings.set_strv('allindicator',childrenNames)
    }

    //iconHideOrVisibleStateChange
    _settingsHiddenIndicatorStateChange(){
        this._settingsJSON = this._importJSONFile();
        
        var rightBoxItems = Main.panel._rightBox.get_children();
        rightBoxItems.map((item, index) => {
            if (item.child !== Main.panel.statusArea.quickSettings && item.child !== this._indicator && this._isVisibleChildrenInIt(item.child)) {
                item.visible = this._visibility;
            }else{
                item.visible = true;
            }
        })
    }
}
