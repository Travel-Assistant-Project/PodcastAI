# Python 3.13'te audioop stdlib'den çıkarıldı; pydub 'pyaudioop' adıyla arıyor.
# audioop-lts paketi sadece 'audioop' modülünü sağlıyor — pyaudioop olarak da
# görünmesi için sys.modules üzerinden alias kuruyoruz.
import sys

try:
    import pyaudioop  # noqa: F401
except ModuleNotFoundError:
    import audioop  # audioop-lts sağlar
    sys.modules["pyaudioop"] = audioop
