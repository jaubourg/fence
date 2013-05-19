nodeunit( "main", { teardown: moduleTeardown }, <%= test %>( jQuery.Fence, jQuery.Deferred ) );
