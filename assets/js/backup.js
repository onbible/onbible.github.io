// js/backup.js

const BackupManager = {
    async exportData() {
        try {
            const data = {
                version: "1.0",
                timestamp: new Date().toISOString(),
                db: {
                    preferences: await onBibleDB.preferences.toArray(),
                    reading_state: await onBibleDB.reading_state.toArray(),
                    notes: await onBibleDB.notes.toArray(),
                    highlights: await onBibleDB.highlights.toArray()
                },
                localStorage: {
                    dark_mode: localStorage.getItem('dark_mode'),
                    reading_font: localStorage.getItem('reading_font'),
                    active_font_family: localStorage.getItem('active_font_family')
                }
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            const date = new Date().toISOString().split('T')[0];
            
            a.href = url;
            a.download = `onbible_backup_${date}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            swal("Sucesso", "Backup exportado com sucesso!", "success");
        } catch (e) {
            console.error("Export failed", e);
            swal("Erro", "Falha ao exportar backup: " + e.message, "error");
        }
    },

    async importData(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                // Simple validation
                if (!data.db || !data.version) {
                    throw new Error("Formato de arquivo inválido.");
                }

                const confirm = await swal({
                    title: "Tem certeza?",
                    text: "Isso irá substituir todos os seus dados atuais (notas, marcadores e configurações) pelos dados do arquivo. Esta ação não pode ser desfeita.",
                    icon: "warning",
                    buttons: ["Cancelar", "Sim, Importar"],
                    dangerMode: true,
                });

                if (confirm) {
                    // 1. Clear current DB
                    await onBibleDB.preferences.clear();
                    await onBibleDB.reading_state.clear();
                    await onBibleDB.notes.clear();
                    await onBibleDB.highlights.clear();

                    // 2. Import items
                    if (data.db.preferences) await onBibleDB.preferences.bulkAdd(data.db.preferences);
                    if (data.db.reading_state) await onBibleDB.reading_state.bulkAdd(data.db.reading_state);
                    if (data.db.notes) await onBibleDB.notes.bulkAdd(data.db.notes);
                    if (data.db.highlights) await onBibleDB.highlights.bulkAdd(data.db.highlights);

                    // 3. Import localStorage
                    if (data.localStorage) {
                        Object.keys(data.localStorage).forEach(key => {
                            const val = data.localStorage[key];
                            if (val !== null) localStorage.setItem(key, val);
                        });
                    }

                    await swal("Sucesso", "Dados restaurados com sucesso! O aplicativo será recarregado.", "success");
                    window.location.reload();
                }
            } catch (err) {
                console.error("Import failed", err);
                swal("Erro", "Falha ao importar backup: " + err.message, "error");
            }
        };
        reader.readAsText(file);
    }
};
