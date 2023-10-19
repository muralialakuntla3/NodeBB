<!-- IMPORT partials/breadcrumbs.tpl -->

<div class="row">
	<div class="col-12 col-sm-8 offset-sm-2">
		<p class="lead text-center">
			{{{ if register }}}[[register:interstitial.intro-new]]{{{ else }}}[[register:interstitial.intro]]{{{ end }}}
		</p>

		{{{ if errors.length }}}
		<div class="alert alert-warning">
			<p>
				[[register:interstitial.errors-found]]
			</p>
			<ul>
				{{{each errors}}}
				<li>{@value}</li>
				{{{end}}}
			</ul>
		</div>
		{{{ end }}}
	</div>
</div>

<form role="form" method="post" action="{config.relative_path}/register/complete" enctype="multipart/form-data">
	<input type="hidden" name="csrf_token" value="{config.csrf_token}" />

	{{{each sections}}}
	<div class="row mb-3">
		<div class="col-12 col-sm-8 offset-sm-2">
			<div class="card">
				<div class="card-body">
					{@value}
				</div>
			</div>
		</div>
	</div>
	{{{end}}}

	<div class="row mt-3">
		<div class="col-12 col-sm-8 offset-sm-2 d-grid">
			<button class="btn btn-primary">[[topic:composer.submit]]</button>
			<button class="btn btn-link" formaction="{config.relative_path}/register/abort">{{{ if register }}}[[register:cancel_registration]]{{{ else }}}[[modules:bootbox.cancel]]{{{ end }}}</button>
		</div>
	</div>
</form>
