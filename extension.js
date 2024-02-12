import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import Gio from 'gi://Gio';
import St from 'gi://St';

export default class HideItems extends Extension {
    constructor(ext) {
        super(ext);
    }

    enable() {
        console.log("Hide Items Extension started...");
        this._indicator = null;
        this._oldIndicator = null;

        //default visibility is true, but in the future i prepare it to state management
        this._settingsJSON = this._importJSONFile();
        this._visibility = this._setVisibiltyState();

        this._iconRank = 0;

        this._createButton()
        this._setIconVisibility();
        

        //Update if a new button added or old removed from the panel
        this._connectHandlerID = Main.panel._rightBox.connect('actor-added', this._addedIconListener.bind(this));
    }

    disable() {
        Main.panel._rightBox.disconnect(this._connectHandlerID);
        this._changeBackVisibility();

        this._showIcon?.destroy();
        this._showIcon = null;
        this._hideIcon?.destroy();
        this._hideIcon = null;
        this._indicator?.destroy();
        this._indicator = null;

        this._oldIndicator = null;
        this._visibility = null;
        this._iconRank = null;
    }

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
        this._oldIndicator = this._indicator;
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
        console.log("index: ", rank)
        return rank - 1;
    }

    //CLICKED BUTTON
    _buttonClicked() {
        this._visibility = !this._visibility;
        this._changeVisibilityState();
        this._hideOrShowItems();
        this._changeIcon();
    }

    _changeIcon() {
        this._setButtonIcon();
    }

    _hideOrShowItems() {
        var rightBoxItems = Main.panel._rightBox.get_children();
        //console.log("items: ", rightBoxItems.toString())
        //console.log("indicator: ", this._indicator.toString())
        rightBoxItems.map((item, index) => {
            if (item.child !== Main.panel.statusArea.quickSettings && item.child !== this._indicator) {
                item.visible = this._visibility;
            }
        })
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
            log('Hiba történt:', error.message);
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
            log('Hiba történt:', error.message);
        }
    }

    _setVisibiltyState(){
        if(this._settingsJSON.state){
            return this._settingsJSON.visibility;
        }else{
            return true;
        }
    }
    
    _changeVisibilityState(){
        if(this._settingsJSON.state){
            this._updateJSONFile(this._settingsJSON.state,this._visibility);
        }
    }


}
