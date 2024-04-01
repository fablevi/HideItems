import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
//import * as Main from 'resource:///org/gnome/shell/ui/main.js';

import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class HideItemsPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        window.set_default_size(700-122, 800-122);
        let settings = this.getSettings();
        let json = this._importJSONFile();

        this._updateIndicatorsOnRightBox(settings);

        let builder = new Gtk.Builder();
        builder.set_translation_domain(this.metadata['gettext-domain']);
        builder.add_from_file(this.dir.get_child('settings.ui').get_path());

        let comboRowState = builder.get_object('state');

        if (json.state.toString() == "0") {
            comboRowState.set_selected(0);
        } else {
            comboRowState.set_selected(1);
        }

        comboRowState.connect("notify::selected-item", () => {
            this._comboRowStateChange(comboRowState, settings);
        })

        let comboRowDefVisibility = builder.get_object('defualtvisibility');

        if (json.defaultVisibility.toString() == "true") {
            comboRowDefVisibility.set_selected(0);
        } else {
            comboRowDefVisibility.set_selected(1);
        }

        comboRowDefVisibility.connect("notify::selected-item", () => {
            this._comboRowDefVisibilityUpdateJSON(comboRowDefVisibility)
        })

        window.add(builder.get_object('settings_page'));

        console.log(this._getAllIndicator(settings))
        this._generateButtons(json, this._getAllIndicator(settings), builder.get_object('visiblityIcons'), settings);
        this._generateClearButton(json, this._getAllIndicator(settings), builder.get_object('extraData'), settings);
    }

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
            console.log('Something wrong happened:', error.message);
            return null;
        }
    }

    _comboRowStateChange(pos, settings) {
        console.log('_comboRowStateChange', pos.selected)
        try {
            switch (pos.get_selected()) {
                case 0:
                    settings.set_string("hideiconstate", "0");
                    console.log(settings.get_string("hideiconstate"))
                    break;
                case 1:
                    settings.set_string("hideiconstate", "1");
                    console.log(settings.get_string("hideiconstate"))
                    break;
                default:
                    console.log("nem mentek!!")
                    break;
            }
        } catch (error) {
            console.log('error', error);
        }

    }

    _comboRowDefVisibilityUpdateJSON(pos) {
        console.log('_comboRowDefVisibilityUpdateJSON', pos.selected)
        try {
            switch (pos.get_selected()) {
                case 0:
                    this._updateJSONFile(true)
                    console.log("Visibile")
                    break;
                case 1:
                    this._updateJSONFile(false)
                    console.log("Hidden")
                    break;
                default:
                    console.log("nem mentek!!")
                    break;
            }
        } catch (error) {
            console.log('error', error);
        }
    }

    _updateJSONFile(newDefVisibility) {
        let settingsJSONpath = `${this.path}/settings.json`
        try {
            let file = Gio.File.new_for_path(settingsJSONpath);
            let [success, content] = file.load_contents(null);

            if (success) {
                let json = JSON.parse(content);

                // Frissítsd a "position" kulcs értékét az új pozícióval
                json.defaultVisibility = newDefVisibility;

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

    _updateVisibleIndicator(newVisibility) {
        let settingsJSONpath = `${this.path}/settings.json`
        try {
            let file = Gio.File.new_for_path(settingsJSONpath);
            let [success, content] = file.load_contents(null);

            if (success) {
                let json = JSON.parse(content);

                // Frissítsd a "position" kulcs értékét az új pozícióval
                json.visibleChildren = newVisibility;

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

    _getAllIndicator(settings) {
        return settings.get_strv("allindicator")
    }

    _generateButtons(json, allindicator, parentObject, settings) {
        console.log(json.visibleChildren)

        let buttonsArray = [];

        let visibilityIconFront = '🔥'
        let visibilityIconBack = '🔥'

        allindicator.map((item, index) => {

            const marginTopBottom = 2;
            const marginLeftRight = 35;

            let button = new Gtk.Button({
                margin_top: marginTopBottom,    // Opcionális: margó a doboz tetején
                margin_bottom: marginTopBottom, // Opcionális: margó a doboz alján
                margin_start: marginLeftRight,  // Opcionális: margó a doboz bal oldalán
                margin_end: marginLeftRight,    // Opcionális: margó a doboz jobb oldalán
                name: item
            })

            let shownLabelBoolean = false;
            json.visibleChildren.map((visItem, index) => {
                if (visItem == item) {
                    shownLabelBoolean = true;
                }
            })

            //set label
            shownLabelBoolean ? button.set_label(visibilityIconFront + ' ' + item + ' ' + visibilityIconBack) : button.set_label(item);

            button.connect("clicked", (button) => {
                print("A gombra kattintottak!: ", button.get_label());
                this._changeButtonLabel(button, visibilityIconFront, visibilityIconBack, json, settings);
            });

            buttonsArray.push(button)

            parentObject.add(button)
        })

        const resetMarginV = 60;
        const resetMarginLeft = 25;
        const resetMarginRidht = 200;  

        let resetButton  = new Gtk.Button({
            margin_top: resetMarginV,    // Opcionális: margó a doboz tetején
            margin_bottom: resetMarginV / 4, // Opcionális: margó a doboz alján
            margin_start: resetMarginLeft,  // Opcionális: margó a doboz bal oldalán
            margin_end: resetMarginRidht,    // Opcionális: margó a doboz jobb oldalán
            name: "resetButton"
        })

        resetButton.set_label('♻️' + " Set default the shown items " + '♻️') 

        resetButton.connect("clicked", (button) => {
            print("A gombra kattintottak!: ", button.get_label());
            this._resetData(button, allindicator, json, settings, parentObject, buttonsArray);
        });

        buttonsArray.push(resetButton)

        parentObject.add(resetButton)
    }

    _generateClearButton(json, allindicator, parentObject, settings) {
        const marginTopBottom = 30;
        const marginLeft = 60;
        const marginRight = 60;

        let button = new Gtk.Button({
            margin_top: marginTopBottom,    // Opcionális: margó a doboz tetején
            margin_bottom: marginTopBottom, // Opcionális: margó a doboz alján
            margin_start: marginLeft,  // Opcionális: margó a doboz bal oldalán
            margin_end: marginRight,    // Opcionális: margó a doboz jobb oldalán
            name: "clearerButton"
        })

        button.set_label('⚠️' + " Clear data from local file " + '⚠️') 

        //reactive json.visibleChildren.filter((item) => { return allindicator.includes(item) });
        this._setDisbale(json, allindicator, button)

        button.connect("clicked", (button) => {
            print("A gombra kattintottak!: ", button.get_label());
            this._clearLocalData(button, allindicator, json, settings);
        });

        parentObject.add(button)
    }

    //onclick
    _changeButtonLabel(button, visibilityIconFront, visibilityIconBack, json, settings) {
        if (button.get_label() != button.get_name()) {
            button.set_label(button.get_name())
            let array = json.visibleChildren.filter(function (item) {
                console.log(item, button.get_name())
                return item !== button.get_name()
            })
            json.visibleChildren.pop() //?
            json.visibleChildren = array
        } else {
            button.set_label(visibilityIconFront + '' + button.get_name() + '' + visibilityIconBack)
            json.visibleChildren.push(button.get_name())
        }
        this._updateVisibleIndicator(json.visibleChildren)
        settings.set_strv("nothiddenindicator", json.visibleChildren);
        console.log("nothiddenindicator", json.visibleChildren, settings.get_strv("nothiddenindicator"))
    }

    _clearLocalData(button, allindicator, json, settings) {
        //const filteredArray = array1.filter(value => array2.includes(value));
        const newArray = json.visibleChildren.filter((item) => { return allindicator.includes(item) });
        json.visibleChildren.pop(); //?
        json.visibleChildren = newArray;
        this._updateVisibleIndicator(json.visibleChildren)
        settings.set_strv("nothiddenindicator", json.visibleChildren);
        console.log("nothiddenindicator", json.visibleChildren, settings.get_strv("nothiddenindicator"))
        this._setDisbale(json, allindicator, button)
    }

    _setDisbale(json, allindicator, button) {
        const arrayIntersection = json.visibleChildren.filter(item => !allindicator.includes(item));
        console.log("arrayIntersection: ", arrayIntersection, arrayIntersection.length)

        if (arrayIntersection.length == 0){
            button.set_sensitive(false)
            button.set_label('🌿' + " All unnecessarily data is cleared " + '🌱')
        } else {
            button.set_sensitive(true)
        } 
    }

    _resetData(button, allindicator, json, settings, parentObject, buttonsArray){
        json.visibleChildren = [];
        this._updateVisibleIndicator(json.visibleChildren);
        settings.set_strv("nothiddenindicator", json.visibleChildren);
        this._setDisbale(json, allindicator, button)
        //parentObject.remove_all_children()

        buttonsArray.map(item  => {
            parentObject.remove(item)
        })

        this._generateButtons(json, allindicator, parentObject, settings)

    }

    _updateIndicatorsOnRightBox(settings){
        if(settings.get_string("topbarupdater") == "0"){
            settings.set_string("topbarupdater", "1")
        }else{
            settings.set_string("topbarupdater", "0")
        }
    }
}