import path = require('path');
import { TreeItem, TreeItemCollapsibleState } from 'vscode';
import { Team } from '../../types';
import { getIconPath } from '../../constants';
import * as https from 'https';
import * as fs from 'fs';
import * as os from 'os';
import { LocalStorageService } from '../../lib/localStorageService';

export class TeamItem extends TreeItem {
    
    constructor(
        public id: string,
        public readonly team: Team,
        public readonly collapsibleState: TreeItemCollapsibleState,
        public storageManager: LocalStorageService
    ) {
        super(team.name, collapsibleState);

        this.iconPath = {
            light: getIconPath(team.color, team.name),
            dark: getIconPath(team.color, team.name),
        };

        if (team.avatar) {
            this.setIconFromStorageOrDownload(team.avatar, id);
        }
    }
    contextValue = 'teamItem';

    private async downloadAvatar(avatarUrl: string, teamId: string): Promise<string> {
        return new Promise((resolve, reject) => {
            const filePath = path.join(os.tmpdir(), `teamIcon-${teamId}.png`);
            const file = fs.createWriteStream(filePath);
            const request = https.get(avatarUrl, (response) => {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    resolve(filePath);
                });
            }).on('error', (err) => {
                fs.unlink(filePath, (err) => {
                    reject(err);
                });
            });
            request.end();
        });
    };

    private async setIconFromStorageOrDownload(avatarUrl: string, teamId: string) {
        // Verifica si la imagen ya está en el almacenamiento
        const storedIconPath = await this.storageManager.getValue(`teamIcon-${teamId}`);
        if (storedIconPath) {
            // Si existe en el almacenamiento, úsala
            this.iconPath = {
                light: storedIconPath,
                dark: storedIconPath
            };
        } else {
            // Si no existe, descarga la imagen y guárdala
            this.downloadAvatar(avatarUrl, teamId).then((iconPath) => {
                this.iconPath = {
                    light: iconPath,
                    dark: iconPath
                };
                this.storageManager.setValue(`teamIcon-${teamId}`, iconPath); 
            });
        }
    }
}