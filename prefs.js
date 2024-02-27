import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

import GLib from 'gi://GLib';
import Gdk from 'gi://Gdk';

import { ExtensionPreferences, gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class HideItemsPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        let settings = this.getSettings();
        let json = this._importJSONFile();

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
            this._comboRowStateChange(comboRowState, settings)
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
        this._generateButtons(json, this._getAllIndicator(settings), builder.get_object('visiblityIcons'))

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

    _generateButtons(json, allindicator, parentObject) {
        console.log(json.visibleChildren)

        let visibilityIconFront = '🔍️'
        let visibilityIconBack = '🔎'

        allindicator.map((item, index) => {

            const marginTopBottm = 2;
            const marginLeftRight = 50;

            let button = new Gtk.Button({
                margin_top: marginTopBottm,    // Opcionális: margó a doboz tetején
                margin_bottom: marginTopBottm, // Opcionális: margó a doboz alján
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
                this._changeButtonLabel(button, visibilityIconFront, visibilityIconBack, json);
            });


            parentObject.add(button)
        })
    }

    //onclick
    _changeButtonLabel(button, visibilityIconFront, visibilityIconBack, json) {
        if (button.get_label() != button.get_name()) {
            button.set_label(button.get_name())
            let array = json.visibleChildren.filter(function (item) {
                console.log(item, button.get_name())
                return item !== button.get_name()
            })
            json.visibleChildren.pop()
            json.visibleChildren = array
        } else {
            button.set_label(visibilityIconFront + '' + button.get_name() + '' + visibilityIconBack)
            json.visibleChildren.push(button.get_name())
        }
        this._updateVisibleIndicator(json.visibleChildren)
    }
}