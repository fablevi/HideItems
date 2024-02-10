import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import Gio from 'gi://Gio';
import St from 'gi://St';

export default class HideItems extends Extension {
    constructor(ext) {
        super(ext);
    }

    enable() {
        this._indicator = null;

        this._showIcon = null;
        this._hideIcon = null;
    }

    disable() {
        this._indicator = null;

        this._showIcon = null;
        this._hideIcon = null;
    }

    _createButton(){
        //icon size
        this._iconSize = 16;

        const showAdwIcon = Gio.icon_new_for_string(`${this.path}/icons/left-symbolic.svg`);
        this._showIcon = this._createIcon(showAdwIcon);

        const hideAdwIcon = Gio.icon_new_for_string(`${this.path}/icons/right-symbolic.svg`);
        this._hideIcon = this._createIcon(hideAdwIcon);

    }

    _createIcon(icon) {
        return new St.Icon({
            gicon: icon,
            style_class: 'system-status-icon',
            icon_size: this._iconSize
        });
    }
}
