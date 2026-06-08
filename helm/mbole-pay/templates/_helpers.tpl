{{- define "mbole-pay.name" -}}
mbole-pay
{{- end -}}

{{- define "mbole-pay.fullname" -}}
{{- printf "%s" .Release.Name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{- define "mbole-pay.labels" -}}
app.kubernetes.io/name: {{ include "mbole-pay.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: Helm
{{- end -}}
