<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreWeightRecordRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Auth;

class WeightRecordController extends Controller
{
    public function store(StoreWeightRecordRequest $request): RedirectResponse
    {
        Auth::user()->weightRecords()->create($request->validated());

        return back()->with('success', 'Weight record added successfully.');
    }
}
