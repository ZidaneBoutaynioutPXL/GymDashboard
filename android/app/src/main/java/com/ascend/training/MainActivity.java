package com.ascend.training;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;
import android.graphics.Color;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().getDecorView().setBackgroundColor(Color.rgb(8, 12, 20));
    }
}
