import sys
import os
import shutil
from PyQt5.QtWidgets import (
    QApplication, QWidget, QVBoxLayout, QPushButton,
    QLabel, QFileDialog, QMessageBox, QProgressBar, QTextEdit
)
from PyQt5.QtCore import Qt, QThread, pyqtSignal
from docx2pdf import convert


class Worker(QThread):
    progress_signal = pyqtSignal(int, str)  # 进度, 日志文本
    finish_signal = pyqtSignal()

    def __init__(self, folder_path):
        super().__init__()
        self.folder_path = folder_path

    def run(self):
        # 先统计总文件数
        total_files = 0
        for root, dirs, files in os.walk(self.folder_path):
            total_files += len(files)

        count = 0
        for root, dirs, files in os.walk(self.folder_path):
            for file in files:
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(root, self.folder_path)
                output_dir = os.path.join(self.folder_path + "_output", rel_path)

                os.makedirs(output_dir, exist_ok=True)

                try:
                    if file.lower().endswith((".docx", ".doc")):
                        pdf_path = os.path.join(output_dir, os.path.splitext(file)[0] + ".pdf")
                        convert(file_path, pdf_path)
                        log_msg = f"转换成功: {file} → {pdf_path}"
                    else:
                        shutil.copy2(file_path, os.path.join(output_dir, file))
                        log_msg = f"复制文件: {file}"
                except Exception as e:
                    log_msg = f"处理失败: {file} 错误: {e}"

                count += 1
                progress = int((count / total_files) * 100)
                self.progress_signal.emit(progress, log_msg)

        self.finish_signal.emit()


class WordToPdfApp(QWidget):
    def __init__(self):
        super().__init__()
        self.folder_path = ""
        self.worker = None
        self.initUI()

    def initUI(self):
        self.setWindowTitle("Word 批量转 PDF 工具")
        self.setGeometry(400, 200, 600, 400)

        layout = QVBoxLayout()

        self.label = QLabel("请选择一个文件夹", self)
        layout.addWidget(self.label)

        self.btn_select = QPushButton("选择文件夹", self)
        self.btn_select.clicked.connect(self.select_folder)
        layout.addWidget(self.btn_select)

        self.btn_confirm = QPushButton("开始转换", self)
        self.btn_confirm.clicked.connect(self.start_convert)
        layout.addWidget(self.btn_confirm)

        # 进度条
        self.progress = QProgressBar(self)
        self.progress.setAlignment(Qt.AlignCenter)
        layout.addWidget(self.progress)

        # 日志窗口
        self.log = QTextEdit(self)
        self.log.setReadOnly(True)
        layout.addWidget(self.log)

        self.setLayout(layout)

    def select_folder(self):
        folder = QFileDialog.getExistingDirectory(self, "选择文件夹")
        if folder:
            self.folder_path = folder
            self.label.setText(f"已选择目录: {folder}")

    def start_convert(self):
        if not self.folder_path:
            QMessageBox.warning(self, "警告", "请先选择一个文件夹！")
            return

        self.log.clear()
        self.progress.setValue(0)

        self.worker = Worker(self.folder_path)
        self.worker.progress_signal.connect(self.update_progress)
        self.worker.finish_signal.connect(self.finish_job)
        self.worker.start()

    def update_progress(self, value, log_msg):
        self.progress.setValue(value)
        self.log.append(log_msg)

    def finish_job(self):
        QMessageBox.information(self, "完成", "所有文件处理完成！")


if __name__ == "__main__":
    app = QApplication(sys.argv)
    window = WordToPdfApp()
    window.show()
    sys.exit(app.exec_())
