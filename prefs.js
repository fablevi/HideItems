import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';
import {ExtensionPreferences,gettext as _ } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class HideItemsPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        let settings = this.getSettings();
        let json = this._importJSONFile();

        let builder = new Gtk.Builder();
        builder.set_translation_domain(this.metadata['gettext-domain']);
        builder.add_from_file(this.dir.get_child('settings.ui').get_path());

        let comboRowState = builder.get_object('state'); 

        if(json.state.toString() == "0"){
            comboRowState.set_selected(0);
        }else{
            comboRowState.set_selected(1);  
        }

        comboRowState.connect("notify::selected-item",()=>{
            this._comboRowStateChange(comboRowState, settings)
        })

        window.add(builder.get_object('settings_page'));

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
            log('Hiba történt:', error.message);
            return null;
        }
    }

    _comboRowStateChange(pos, settings){
        console.log('_comboRowStateChange',pos.selected)
        try{
            switch(pos.get_selected()){
                case 0:
                    settings.set_string("hideiconstate","0");
                    console.log(settings.get_string("hideiconstate"))
                    break;
                case 1:
                    settings.set_string("hideiconstate","1");
                    console.log(settings.get_string("hideiconstate"))
                    break;
                default:
                    console.log("nem mentek!!")
                    break;
            }
        }catch(error){
            console.log('error',error);
        }
        
    }
}